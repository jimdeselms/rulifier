import { builtinHandlers } from "./builtinHandlers"
import { GET_WITH_NEW_ROOT, RAW_VALUE, COST } from "./common"
import { calculateCost } from './calculateCost'

const IS_RULIFIED = Symbol.for("__IS_RULIFIED")
const IS_MATERIALIZED = Symbol.for("__IS_MATERIALIZED")
const SIMPLE_OBJECT = Symbol.for("__SIMPLE_OBJECT")

/**
 * @param  {...Record<any, any>} dataSources
 * @returns {any}
 */
export function rulify(...dataSources) {
    const root = {}
    let handlers = {}

    // The caches use weak maps so that they won't cause memory leaks
    // when the proxies or resolved values go out of scope.
    const caches = {
        proxyCache: new WeakMap(),
        resolvedValueCache: new WeakMap(),
    }

    for (let dataSource of dataSources) {
        if (dataSource[IS_RULIFIED]) {
            // If the thing is "already rulfied", then we want to grab the
            // raw value and re-proxify it.
            dataSource = dataSource[RAW_VALUE]
        }
        Object.assign(root, dataSource)
        Object.assign(handlers, normalizeHandlers(dataSource.$handlers))
    }

    delete root.$handlers

    Object.assign(handlers, builtinHandlers)

    return proxify(root, handlers, undefined, undefined, caches)
}

function normalizeHandlers(handlers) {
    if (!handlers) {
        return undefined
    }

    const entries = Object.entries(handlers).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

export function proxify(value, handlers) {
    const type = typeof value

    if (value === null || (type !== "object" && type !== "function")) {
        return proxify({ [SIMPLE_OBJECT]: value }, handlers)
    }

    // Already a proxify? Just return it.
    if (value[IS_RULIFIED]) {
        return value
    }

    // Create the proxy, and add the handlers later so that they can reference the proxy.
    const proxyHandler = {}
    const proxy = new Proxy(value, proxyHandler)

    proxyHandler.get = function (target, prop) {
        return get(target, prop, handlers)
    }

    return proxy
}

function get(target, prop, handlers) {
    // What if the thing actually has a property called "value"?
    switch (prop) {
        case "value": return () => materialize(target, handlers)
        case IS_RULIFIED: return true
        case RAW_VALUE: return target
        // case "then": return (fn) => {
        //     debugger

        //     if (typeof target.then === "function") {
        //         target.then(result => {
        //             proxify(result, handlers)
        //         }).then(fn)
        //     } else {
        //         return fn(target)
        //     }
        // }
    }

    return getAsync(target, prop, handlers)

    const resolved = resolve(target, handlers)
    
    if (prop === "value") {
        return () => materialize(resolved, handlers)
    }

    if (prop === "then") {
        return (fn) => {
            if (typeof resolved.then === "function") {
                return resolved.then(result => {
                    proxify(result, handlers)
                }).then(fn)
            } else {
                debugger
                return fn(proxify(resolved, handlers))
            }
        }
    }

    return proxify(resolved[prop], handlers)

    // const resolved = resolve(target, handlers)

    // if (typeof target.then === "function") {
    //     return target.then(value => {
    //         const result = proxify(value, handlers)
    //         return get(result, prop, handlers)
    //     })
    // }

    // const handlerAndArg = getHandlerAndArgument(target, handlers)
    // if (handlerAndArg) {
    //     const result = evaluateHandler(handlerAndArg, handlers).then(value => {
    //         const r = proxify(value, handlers)
    //         return get(r, prop, handlers)
    //     })
    //     return proxify(result, handlers)
    // }

    // if (prop === SIMPLE_OBJECT) {
    //     return target[SIMPLE_OBJECT]
    // }

    // return proxify(target[prop], handlers)
}

async function getAsync(target, prop, handlers) {
    
}

// Takes an object and gets it to a state where it's a boring object
export function resolve(obj, handlers) {
    // If it's a promise, then the result is a promise that resolves to the proxified value.
    if (typeof obj.then === "function") {
        return obj.then(async value => {
            const resolved = await resolve(value, handlers)
            return resolved
        })
    }

    const handlerAndArg = getHandlerAndArgument(obj, handlers)
    if (handlerAndArg) {
        return evaluateHandler(handlerAndArg, handlers).then(async value => {
            const resolved = await resolve(value)
            return resolved
        })
    }

    // If there's nothing special about this object, then it's already resolved and we can just return it.
    return obj
}

function getHandlerAndArgument(obj, handlers) {
    const keys = Object.keys(obj)
    let key, handler
    if (keys.length === 1 && (key = keys[0])[0] === "$" && (handler = handlers[key])) {
        return { handler, argument: obj[key] }
    } else {
        return undefined
    }
}

async function evaluateHandler({ handler, argument }, handlers) {
    const arg = handler.name === "$fn"
        ? argument
        : proxify(await argument, handlers)

    const result = await handler(arg)

    return proxify(result, handlers)
}


async function materialize(value, handlers) {

    if (SIMPLE_OBJECT in value) {
        return value[SIMPLE_OBJECT]
    }

    const type = typeof value
    if (value === null || (type !== "object" && type !== "function")) {
        return value
    }

    // This is a promise, so we'll resolve it
    if (typeof value?.then === "function") {
        const result = await value
        return await materialize(result, handlers)
    }

    const handlerAndArg = getHandlerAndArgument(value, handlers)
    if (handlerAndArg) {
        const result = await evaluateHandler(handlerAndArg, handlers)
        return materialize(result, handlers)
    }

    const result = Array.isArray(value)
    for (const [k, v] of Object.entries(value)) {
        result[k] = await materialize(v, handlers)
    }

    return result
}

// export function proxify2(dataSource, handlers, root, prop, caches) {
//     // if (caches.proxyCache.has(dataSource)) {
//     //     return caches.proxyCache.get(dataSource)
//     // }

//     const type = typeof dataSource

//     if (dataSource === null || (type !== "object" && type !== "function")) {
//         // It's just a simple object, so we want to proxify a promise that returns it.
//         return proxify(Promise.resolve(dataSource), handlers, root, prop, caches)
//     }

//     // If the thing is already a proxy, return it.
//     if (dataSource[IS_RULIFIED]) {
//         return dataSourcd
//     }

//     // Check if it's a call to a handler
//     const keys = Object.keys(dataSource)
//     let key, handler

//     // If it's a call to a handler then get the value of the proxy and call the handler with it.
//     if (keys.length === 1 && (key = keys[0]) && (handler = handlers?.[key])) {
//         const handlerArgument = proxify(dataSource[key], handlers, root, prop, caches)
//         const handlerResult = handler(handlerArgument, { root, prop })
//         return proxify(handlerResult, handlers, root, prop, caches)
//     }

//     // Create the proxy, and add the handlers later so that they can reference the proxy.
//     const proxyHandler = {}
//     const proxy = new Proxy(dataSource, proxyHandler)

//     caches.proxyCache.set(dataSource, proxy)

//     proxyHandler.get = function (target, prop) {
//         return get(target, proxy, prop, root, handlers, caches)
//     }

//     proxyHandler.apply = function (target, thisArg, argumentsList) {
//         debugger
//         const result = target.apply(thisArg, argumentsList)
//         return proxify(result, handlers, root, prop, caches)
//     }

//     // If root isn't yet defined, then this must be the top object.
//     if (root === undefined) {
//         root = proxy
//     }

//     return proxy
// }

// function get(target, proxy, prop, root, handlers, caches) {

//     debugger
    
//     // Handle these special properties first. Switch is faster than an if-else chain.
//     switch (prop) {
//         case RAW_VALUE:
//             return target
//         case IS_RULIFIED:
//             return true
//         case GET_WITH_NEW_ROOT:
//             return (newRoot, newProp) => get(target, proxy, newProp, newRoot, handlers, caches)
//         case COST:
//             return calculateCost(target, handlers, caches)
//         case IS_MATERIALIZED:
//             return target[IS_MATERIALIZED]
//     }

//     let resolvedValues = caches.resolvedValueCache.get(proxy)
//     if (resolvedValues) {
//         if (resolvedValues.has(prop)) {
//             return resolvedValues.get(prop)
//         }
//     } else {
//         resolvedValues = new Map()
//         caches.resolvedValueCache.set(proxy, resolvedValues)
//     }

//     let result

//     // If this thing is a promise, and we're 
//     const then = target?.then
//     if (typeof then === "function") {
        
//         async function getValue() {
//             let val = target
//             while (typeof val?.then === "function") {
//                 val = await val
//             }
//             return val
//         }

//         if (prop === "then") {
//             result = async (fn) => {
//                 const val = await getValue()
//                 return fn(proxify(val, handlers, root, prop, caches))
//             }
//         } else {
//             // If this is a function, but we're not asking for then, then we need to 
//             result = async () => {
//                 const val = await getValue()
//                 if (prop === "value" && val?.value === undefined) {
//                     return () => materialize(val)
//                 } else {
//                     return fn(proxify(val[prop], handlers, root, prop, caches))
//                 }
//             }
//         }
//     } else {
//         // If they're asking for the result of a promise, but this isn't a promise, then just
//         // return the proxified target. If it's a simple object, it'll be returned directly.
//         if (prop === "then" && !target.hasOwnProperty("then")) {
//             result = target
//         } else {
//             if (prop === "value" && target?.value === undefined) {
//                 return () => materialize(val)
//             }
//             // It's not a promise, so just get the value directly.
//             result = target[prop]
//         }
//     }

//     const proxified = proxify(result, handlers, root, prop, caches)

//     // And store away this result so that we don't have to evaluate it again.
//     resolvedValues.set(prop, proxified)

//     return proxified
// }
