import { $match } from './handlers/match'
import { $str } from './handlers/str'
import { $ref } from './handlers/ref'
import { $eq } from './handlers/eq'
import { $in } from './handlers/in'
import { $if } from './handlers/if'
import { $switch } from './handlers/switch'
import { $and, $or, $not } from './handlers/booleanOperators'

import { $lt, $gt, $lte, $gte, $ne, $regex } from './handlers/binaryOperators'

export const builtinHandlers = {
    async $handlers() {
        throw new Error("handlers can only be defined at the root of a context")
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
}
