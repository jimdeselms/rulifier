function buildResponse(...contexts) {
    const merged = {}
    const directives = {}

    for (const context of contexts) {
        const [values, currDirectives] = splitValuesAndDirectives(context)
        Object.assign(merged, values)
        Object.assign(directives, currDirectives)
    }

    return proxify(merged, directives)
}

function splitValuesAndDirectives(obj) {
    const values = {}
    const directives = {}

    for (const [key, value] of Object.entries(obj)) {
        (key.startsWith("$") ? directives : values)[key] = value
    }

    return [values, directives]
}

function proxify(context, directives) {
    if (typeof context === "function") {
        context = context()
    }
    
    if (context === null || typeof context !== "object") {
        return context
    }

    const resolved = {}

    const keys = Object.keys(context)
    let directive

    if (keys.length === 1 && (directive = directives[keys[0]])) {
        console.log("found a directive")
    }

    return new Proxy(context, {
        get: (target, prop, handler) => {

            if (Object.getOwnPropertyDescriptor(resolved, prop)) {
                return resolved[prop]
            }
            
            // Is this a promise?
            if (typeof target?.then === "function") {
                if (prop === "then") {
                    return target.then.bind(target)
                } else {
                    return proxify(target.then.bind(target)(data => {
                        const value = data[prop]
                        return proxify(value, directives)
                    }), directives)
                }
            }

            const result = proxify(target[prop], directives)
            resolved[prop] = result

            return result
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