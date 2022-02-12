const TRUE = Symbol.for("__TRUE")
const FALSE = Symbol.for("__FALSE")

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
        return eq(obj, root, true)
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
                const pattern = await y.pattern
                const flags = await y.flags
                return new RegExp(pattern, flags).test(x)
            }
        }),

    async $in(obj, { root, prop }) {
        const lhs = await root[prop]

        for (const entry of obj) {
            if ((await entry) === lhs) {
                return TRUE
            }
        }

        return FALSE
    },
}

async function evaluateBinary(obj, { root, prop }, predicate) {
    const lhs = await root[prop]
    const rhs = await obj

    const result = await predicate(lhs, rhs)
    return result ? TRUE : FALSE
}

async function eq(item1, item2, match) {
    const i1 = await item1
    const i2 = await item2

    if (i1 === i2 || i1 === TRUE) {
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
        const val1 = await i1[GET_WITH_NEW_ROOT](i2, prop)
        const val2 = await i2[prop]

        if (!(await eq(val1, val2, match))) {
            return false
        }
    }

    return true
}

module.exports = { builtinDirectives }
