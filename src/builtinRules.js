import { $eq } from "./rules/eq"
import { $fn } from "./rules/fn"
import { $if } from "./rules/if"
import { $in } from "./rules/in"
import { $match } from "./rules/match"
import { $ref } from "./rules/ref"
import { $str } from "./rules/str"
import { $switch } from "./rules/switch"
import { $apply } from "./rules/apply"
import { $and, $or, $not } from "./rules/booleanOperators"
import { $lt, $gt, $lte, $gte, $ne, $regex } from "./rules/binaryOperators"

export const builtinRules = {
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
