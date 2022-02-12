const TRUE = Symbol.for("__TRUE")
const FALSE = Symbol.for("__FALSE")

const builtinDirectives = {
    async $directives() {
        throw new Error("directives can only be defined at the root of a context")
    },
    async $if(obj) {
        const condition = await obj.condition
        return condition ? obj.then : obj.else
    },

    async $rule(obj, { root }) {
        for (const key in obj) {
            const objVal = await obj[key]

            if (objVal === TRUE) {
                continue
            } else if (objVal === FALSE) {
                return false
            }

            const rootVal = await root[key]

            if (objVal !== rootVal) {
                return false
            }
        }

        return true
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

    async $in(obj, {root, prop}) {
        const lhs = await root[prop]

        for (const entry of obj) {
            if (await entry === lhs) {
                return TRUE
            }
        }

        return FALSE
    }

}

async function evaluateBinary(obj, { root, prop }, predicate) {
    const lhs = await root[prop]
    const rhs = await obj

    return predicate(lhs, rhs) ? TRUE : FALSE
}

module.exports = { builtinDirectives }