import { rulify, realize } from '../src'
import { COST } from '../src/symbols'

describe('calculateCost', () => {
    it('calculates the cost of nodes and executes cheapest first', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(10, false, "third"),
                   calc(5, false, "second"),
                   calc(1, false, "first")
               ]
           }
        })

        expect(await realize(obj.value)).toBe(false)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('short circuits if a cheaper node is true', async () => {
        // In this case, since the first is cheapest -- and true -- it short circuits
        // so that the other nodes don't have to be evaluated
        const { obj, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(10, false, "third"),
                   calc(5, false, "second"),
                   calc(1, true, "first")
               ]
           }
        })

        expect(await realize(obj.value)).toBe(true)

        expect(messages).toMatchObject(["first"])
        expect(getCostCalls()).toBe(3)
    })

    it('does not bother sorting if there is only one value', async () => {
        // In this case, since the first is cheapest -- and true -- it short circuits
        // so that the other nodes don't have to be evaluated
        const { obj, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(1, true, "first")
               ]
           }
        })

        expect(await realize(obj.value)).toBe(true)

        expect(messages).toMatchObject(["first"])
        expect(getCostCalls()).toBe(0)
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
    let costCalls = 0

    async function $calc(obj, api) {
        const realized = await api.realize(obj)
        messages.push(realized.message ?? realized.value)
        return realized.value
    }

    $calc[COST] = (rawValue, handlers) => {
        debugger
        costCalls++
        return rawValue.cost
    }

    debugger

    return {
        obj: await rulify({ 
            $handlers: { $calc }
            , ...value 
        }),
        messages,
        getCostCalls() { return costCalls }
    }
}

