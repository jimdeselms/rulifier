import { rulify } from './index'

const CALCULATE_COST = Symbol.for("__CALCULATE_COST")

describe('calculateCost', () => {
    it('calculates the cost of nodes', async () => {
        const { obj, messages } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(5, false),
                   calc(1, true)
               ]
           }
        })

        expect(await obj.value).toBe(true)

        expect(messages.length).toBe(1)
    })
})

function calc(cost, value=undefined, message=undefined) {
    return {
        $calc: {
            cost,
            value,
            message
        }
    }
}

async function rulifyWithCalc(value) {
    const messages = []

    async function $calc(obj) {
        await obj.value
    }

    $calc[CALCULATE_COST] = (rawValue, handlers) => {
        messages.push(rawValue.message ?? rawValue.value)
        return rawValue.cost
    }

    return {
        obj: await rulify({ 
            $handlers: { $calc }
            , ...value 
        }),
        messages
    }
}

