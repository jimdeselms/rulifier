function buildResponse(...contexts) {
    const merged = Object.assign({}, ...contexts)

    return proxify(merged)
}

function proxify(context) {
    if (typeof context === "function") {
        context = context()
    }
    
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
                    return proxify(target.then.bind(target)(data => {
                        const value = data[prop]
                        return proxify(value)
                    }))
                }
            }

            const result = target[prop]

            return proxify(result)
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