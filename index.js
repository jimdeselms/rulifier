async function evaluateRule(rule, context={}, contextProviders={}) {
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
    for (const key in rule) {
        if (context[key] === undefined) {
            return true
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
    evaluateRule
}