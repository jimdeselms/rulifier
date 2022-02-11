const builtinDirectives = {
    async $directives() { throw new Error("directives can only be defined at the root of an object")},
    async $if(obj) {
        const condition = await obj.condition
        return condition ? obj.ifTrue : obj.ifFalse
    }
}

function buildResponse(...contexts) {
    const merged = {}
    const directives = Object.assign({}, builtinDirectives)

    for (const context of contexts) {
        Object.assign(merged, context)
        Object.assign(directives, normalizeDirectives(context.$directives))
    }

    delete merged.$directives

    return proxify(merged, directives)
}

function normalizeDirectives(directives) {
    if (!directives) { return undefined }

    const entries = Object.entries(directives)
        .map(([k,v]) => [k[0]==="$" ? k : "$"+k, v])

    return Object.fromEntries(entries)
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
    let key, directive

    if (keys.length === 1 && (key = keys[0]) && (directive = directives[key])) {
        return proxify(directive(context[key]))
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
