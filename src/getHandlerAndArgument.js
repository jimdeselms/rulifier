export function getHandlerAndArgument(obj, handlers) {
    if (typeof obj !== "object") {
        return undefined
    }

    const keys = Object.keys(obj)
    let key, handler
    if (keys.length === 1 && (key = keys[0])[0] === "$" && (handler = handlers[key])) {
        return { handler, argument: obj[key] }
    } else {
        return undefined
    }
}
