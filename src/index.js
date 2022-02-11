const builtinDirectives = {
    async $directives() { throw new Error("directives can only be defined at the root of an object")},
    async $if(obj) {
        const condition = await obj.condition
        return condition ? obj.then : obj.else
    },
    async $rule(obj, root) {
        for (const key in obj) {
            const objVal = await obj.value
            const rootVal = await root.value

            if (objVal !== rootVal) {
                return false
            }
        }

        return true
    },
    async $and(obj, root) {
        for (const value of await obj) {
            if (!await value) {
                return false
            }
        }
        return true
    },
    async $or(obj, root) {
        for (const value of await obj) {
            if (await value) {
                return true
            }
        }
        return false
    }
}

function buildResponse(...contexts) {
    const root = {}
    const directives = Object.assign({}, builtinDirectives)

    for (const context of contexts) {
        Object.assign(root, context)
        Object.assign(directives, normalizeDirectives(context.$directives))
    }

    delete root.$directives

    return proxify(root, directives)
}

function normalizeDirectives(directives) {
    if (!directives) { return undefined }

    const entries = Object.entries(directives)
        .map(([k,v]) => [k[0]==="$" ? k : "$"+k, v])

    return Object.fromEntries(entries)
}

function proxify(context, directives, root) {
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
        return proxify(directive(context[key], root), directives, root)
    }

    const proxy = new Proxy(context, {
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
                        return proxify(value, directives, root)
                    }), directives, root)
                }
            }

            const result = proxify(target[prop], directives, root)
            resolved[prop] = result

            return result
        }
    })

    if (root === undefined) {
        root = proxy
    }

    return proxy
}

module.exports = {  
    buildResponse
}
