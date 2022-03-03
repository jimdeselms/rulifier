const { $eq } = require("./handlers/eq")
const { $fn } = require("./handlers/fn")
const { $if } = require("./handlers/if")
const { $in } = require("./handlers/in")
const { $match } = require("./handlers/match")
const { $ref } = require("./handlers/ref")
const { $str } = require("./handlers/str")
const { $switch } = require("./handlers/switch")
const { $and, $or, $not } = require("./handlers/booleanOperators")
const { $lt, $gt, $lte, $gte, $ne, $regex } = require("./handlers/binaryOperators")

const builtinHandlers = {
    async $handlers() {
        throw new Error("handlers can only be defined at the root of a data source")
    },

    $if,
    $switch,
    $match,
    $eq,

    $lt,
    $gt,
    $lte,
    $gte,
    $ne,
    $regex,

    $and,
    $or,
    $not,

    $in,
    $ref,
    $str,

    $fn,
}

module.exports.builtinHandlers = builtinHandlers
