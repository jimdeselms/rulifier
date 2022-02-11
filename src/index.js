function buildResponse(...contexts) {
    const merged = Object.assign({}, ...contexts)

    return proxify(merged)
}

function proxify(context) {
    if (context === null || typeof context !== "object") {
        return context
    }

    return new Proxy(context, {
        get: (target, prop, handler) => {

            // Is this a promise?
            if (typeof target?.then === "function") {
                if (prop === "then") {
                    return target.then.bind(target)
                } else {
                    return target.then.bind(target)(data => {
                        const value = data[prop]
                        if (typeof value === "function") {
                            return proxify(value())
                        } else {
                            return proxify(value)
                        }
                    })
                }
            }

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