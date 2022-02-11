function buildResponse(...contexts) {
    const merged = Object.assign({}, ...contexts)

    return proxify(merged)
}

function proxify(context) {
    if (context === null || typeof context !== "object") {
        return context
    }

    const then = context.then
    if (typeof then === "function") {
        return context
    }

    return new Proxy(context, {
        get: (target, prop, handler) => {
            const result = target[prop]

            if (typeof result === "function") {
                return proxify(result())
            } else {
                return proxify(result)
            }
        }
    })
}

module.exports = {  
    buildResponse
}





/*

What I want is to return a promise which also happens to have the properties of the next thing in the chain.
So, if you call "then" on the thing, then you'll resolve the promise.
// If you get one of the other properties, then you'll get the other thing.

*/