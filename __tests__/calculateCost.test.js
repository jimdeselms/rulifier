import { rulify, realize } from '../src'
import { COST } from '../src/symbols'

describe('calculateCost', () => {
    it('calculates the cost of nodes', async () => {
        // In this case, since the second rule is less expensive than the first, I'd
        // expect the first to be executed, and since it's true, it should short circuit,
        // preventing the second from executing
        const { obj, messages } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(5, false, "second"),
                   calc(1, true, "first")
               ]
           }
        })

        expect(await realize(obj.value)).toBe(true)

        expect(messages.length).toBe(1)
        expect(messages).toMatchObject(["first"])
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

    async function $calc(obj, api) {
        const realized = await api.realize(obj)
        messages.push(realized.message ?? realized.value)
        return realized.value
    }

    $calc[COST] = (rawValue, handlers) => {
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

