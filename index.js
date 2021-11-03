/**
 * 
 * @param {string} rule A rule
 * @param {Record<string, any>} context An object containing known context values. For items that are not known initially, they will be filled
 * in as the context providers are invoked.
 * @param {Record<string, (ctx) => any>} contextProviders A set of functions that, given context object, will give the value of a requested property.
 * @returns boolean
 */
async function evaluateRule(rule, context={}, contextProviders={}) {
    const mutableContext = {...context}

    return await evaluateRuleWithMutableContext(rule, mutableContext, contextProviders)
}

async function selectValue(possibleValues, context={}, contextProviders={}) {
    const mutableContext = {...context}

    for (const { rule, value } of possibleValues) {
        if (await evaluateRuleWithMutableContext(rule, context, contextProviders)) {
            return await getValue(value, context, contextProviders)
        }
    }

    return undefined
}

async function getValue(parameterizedObject, context, contextProviders) {
    switch (typeof(parameterizedObject)) {
        case "string":
            return await replaceTokens(parameterizedObject, context, contextProviders)
        case "object":
            if (parameterizedObject === null) {
                return null
            } else if (Array.isArray(parameterizedObject)) {
                return await Promise.all(parameterizedObject.map(o => getValue(o, context, contextProviders)))
            } else {
                const result = {}
                const entries = await Promise.all(Object.entries(parameterizedObject).map(async ([key, value]) => [key, await getValue(value, context,  contextProviders)]))
                return Object.fromEntries(entries)
            }
        default:
            return parameterizedObject
    }
}

async function replaceTokens(str, context, contextProviders) {
    const matches = str.matchAll(/{[a-zA-Z0-9]+}/g)
    for (const match of matches) {
        const key = match[0].slice(1, -1)
        const value = await getPropertyFromContext(key, context, contextProviders)
        if (value) {
            str = str.replace(`{${key}}`, value)
        }
    }

    return str
}

async function evaluateRuleWithMutableContext(rule, context, contextProviders) {
    if (Array.isArray(rule)) {
        return await evaluateOrRule(rule, context, contextProviders)
    } else {
        return await evaluateSingleRule(rule, context, contextProviders)
    }
}

async function evaluateOrRule(rules, context, contextProviders) {
    const slowRules = []

    for (const r of rules) {
        if (isSlowRule(r, context, contextProviders)) {
            slowRules.push(r)
            continue
        } else if (await evaluateSingleRule(r, context, contextProviders)) {
            return true
        }
    }

    // If we get here, and we still have "slow" rules, then we'll try those.
    for (const r of slowRules) {
        if (await evaluateSingleRule(r, context, contextProviders)) {
            return true
        }
    }

    // No rule passed.
    return false
}

function isSlowRule(rule, context, contextProviders) {
    if (Array.isArray(rule)) {
        return rule.some(r => isSlowRule(r, context, contextProviders))
    } else {
        for (const key in rule) {
            if (context[key] === undefined) {
                return true
            }
        }
    }

    return false
}

async function evaluateSingleRule(rule, context, contextProviders) {
    for (const [property, expectedValue] of Object.entries(rule)) {
        const fromContext = await getPropertyFromContext(property, context, contextProviders)
        if (Array.isArray(expectedValue)) {
            if (!expectedValue.includes(fromContext)) {
                return false
            }
        } else {
            if (fromContext !== expectedValue) {
                return false
            }
        }
    }

    return true
}

async function getPropertyFromContext(property, ctx, providers) {
    const value = ctx[property]
    if (value !== undefined) {
        return value
    }

    const provider = providers[property]
    if (!provider) {
        return undefined
    }

    const calculatedValue = await provider(ctx)
    ctx[property] = calculatedValue

    return calculatedValue
}

module.exports = {
    evaluateRule,
    selectValue
}