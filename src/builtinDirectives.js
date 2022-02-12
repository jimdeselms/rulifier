const ROOT_CONTEXT_TRUE = Symbol.for("__TRUE")
const ROOT_CONTEXT_FALSE = Symbol.for("__FALSE")

const RAW_VALUE = Symbol.for("__RAW_VALUE")
const GET_WITH_NEW_ROOT = Symbol.for("__GET_WITH_NEW_ROOT")

const builtinDirectives = {
    async $directives() {
        throw new Error("directives can only be defined at the root of a context")
    },

    async $if(obj) {
        const condition = await obj.condition
        return condition ? obj.then : obj.else
    },

    async $match(obj, { root }) {
        obj = await obj
        if (Array.isArray(obj)) {
            return eq(obj[0], obj[1], true, false)
        } else {
            return eq(obj, root, true, true)
        }
    },

    async $eq([item1, item2]) {
        return eq(item1, item2, false)
    },

    async $and(obj) {
        for (const value of obj) {
            if (!(await value)) {
                return false
            }
        }
        return true
    },

    async $or(obj) {
        for (const value of obj) {
            if (await value) {
                return true
            }
        }
        return false
    },

    $lt: (obj, opt) => evaluateBinary(obj, opt, (x, y) => x < y),
    $lte: (obj, opt) => evaluateBinary(obj, opt, (x, y) => x <= y),
    $gt: (obj, opt) => evaluateBinary(obj, opt, (x, y) => x > y),
    $gte: (obj, opt) => evaluateBinary(obj, opt, (x, y) => x >= y),
    $ne: (obj, opt) => evaluateBinary(obj, opt, (x, y) => x !== y),

    $regex: (obj, opt) =>
        evaluateBinary(obj, opt, async (x, y) => {
            if (typeof y === "string") {
                return new RegExp(y).test(x)
            } else {
                return new RegExp(y.pattern, y.flags).test(x)
            }
        }),

    async $in(obj, { root, prop }) {
        const lhs = await root[prop]

        for (const entry of obj) {
            if ((await entry) === lhs) {
                return ROOT_CONTEXT_TRUE
            }
        }

        return ROOT_CONTEXT_FALSE
    },
}

async function evaluateBinary(obj, { root, prop }, predicate) {
    obj = await obj

    if (Array.isArray(obj)) {
        // We're not in the root context; just compare the two things in the array.
        return predicate(await obj[0], await obj[1])
    } else {
        // In the root context, we compare against a property of the root.
        return (await predicate(await root[prop], await obj)) ? ROOT_CONTEXT_TRUE : ROOT_CONTEXT_FALSE
    }
}

async function eq(item1, item2, match, useRootContext) {
    const i1 = await item1
    const i2 = await item2

    if (i1 === i2 || i1 === ROOT_CONTEXT_TRUE) {
        return true
    }

    // Are they at least the same type?
    if (i1 === null || i2 === null) {
        return false
    }

    if (typeof i2 === "string" && i1 instanceof RegExp) {
        return i1[RAW_VALUE].test(i2)
    }

    if (typeof i1 !== "object" || typeof i2 !== "object") {
        return false
    }

    const props = Object.keys(i1)
    if (!match) {
        if (props.length !== Object.keys(i2)) {
            return false
        }
    }

    // Now just make sure that every property of i1 matches i2.
    for (const prop of props) {
        // Since we might have directives here that care about the root, we want to replace the root, so let's use the
        // "GET_WITH_NEW_ROOT" function
        const val1 = useRootContext
            ? i1[GET_WITH_NEW_ROOT](i2, prop)
            : i1[prop]
        const val2 = i2[prop]

        if (!(await eq(val1, val2, match, useRootContext))) {
            return false
        }
    }

    return true
}

module.exports = { builtinDirectives }
