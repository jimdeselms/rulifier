import { $eq } from "./handlers/eq"
import { $fn } from "./handlers/fn"
import { $if } from "./handlers/if"
import { $in } from "./handlers/in"
import { $match } from "./handlers/match"
import { $ref } from "./handlers/ref"
import { $str } from "./handlers/str"
import { $switch } from "./handlers/switch"
import { $apply } from "./handlers/apply"
import { $and, $or, $not } from "./handlers/booleanOperators"
import { $lt, $gt, $lte, $gte, $ne, $regex } from "./handlers/binaryOperators"

export const builtinHandlers = {
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
    $apply,
}
