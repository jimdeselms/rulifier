import { ROUTE } from "./symbols"

export function getRuleAndArgument(obj, rules) {
    if (typeof obj !== "object") {
        return undefined
    }

    const keys = Object.keys(obj)
    let key, rule
    if (keys.length === 1 && (key = keys[0])[0] === "$" && (rule = getHandler(key, rules))) {
        return { rule, argument: obj[key] }
    } else {
        return undefined
    }
}

function getHandler(key, rules) {
    // Special case: since $route isn't really possible to write as a typtical rule,
    // we return this symbol to flag the special case.
    if (key === "$route") {
        return ROUTE
    } else {
        return rules[key]
    }
}
