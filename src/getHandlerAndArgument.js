import { ROUTE } from "./symbols"

export function getHandlerAndArgument(obj, handlers) {
    if (typeof obj !== "object") {
        return undefined
    }

    const keys = Object.keys(obj)
    let key, handler
    if (keys.length === 1 && (key = keys[0])[0] === "$" && (handler = getHandler(key, handlers))) {
        return { handler, argument: obj[key] }
    } else {
        return undefined
    }
}

function getHandler(key, handlers) {
    // Special case: since $route isn't really possible to write as a typtical handler, 
    // we return this symbol to flag the special case.
    if (key === "$route") {
        return ROUTE
    } else {
        return handlers[key]
    }
}