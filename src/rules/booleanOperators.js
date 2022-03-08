import { TRUE, FALSE } from "../symbols"

// This is all super clumsy; since we distinguish between
// "TRUE" and "FALSE" in the $match context, and "true" and "false" in the non-match context,
// then each boolean predicate needs to be aware of both, which makes it harder for someone
// else to write a boolean rule.
//
// TODO - how to make it so that predicates can just return true or false, and let the
// resolveHandler code figure out the right thing to do.
export async function $and(obj, api) {
    const sorted = await api.sortNodesByCost(obj)
    let rootContext = false

    for (const value of sorted) {
        const materialized = await api.materialize(value)
        if (materialized === FALSE) {
            return FALSE
        } else if (!materialized) {
            return false
        } else if (materialized === TRUE) {
            rootContext = true
        }
    }
    return rootContext ? TRUE : true
}

export async function $or(obj, api) {
    const sorted = await api.sortNodesByCost(obj)
    let rootContext = false

    for (const value of sorted) {
        const materialized = await api.materialize(value)
        if (materialized === TRUE) {
            return TRUE
        } else if (materialized) {
            return true
        } else if (materialized === FALSE) {
            rootContext = true
        }
    }
    return rootContext ? FALSE : false
}

export async function $not(obj, api) {
    const result = await api.materialize(obj)
    if (result === TRUE) {
        return FALSE
    } else if (result === FALSE) {
        return TRUE
    } else {
        return !result
    }
}
