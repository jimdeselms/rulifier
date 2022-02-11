function buildResponse(...contexts) {
    const merged = Object.assign({}, ...contexts)

    return chainify(merged)
}

function chainify(context) {
    if (context === null || typeof context !== "object") {
        return context
    }

    return new Proxy(context, {
        get: (target, prop, handler) => {
            if (prop === "then") {
                if (target.then) {
                    return target.then
                } else {
                    return target
                }
            }

            const next = target[prop]
            if (typeof next === "function") {
                const result = next()
                if (result.then && typeof result.then === "function") {
                    return new Promise(r => result.then(resp => r(chainify(resp))))
                } else {
                    return chainify(result)
                }
            } else {
                return chainify(next)
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