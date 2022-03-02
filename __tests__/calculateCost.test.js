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

    it('sorts nodes for and', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $and: [ 
                   calc(10, true, "third"),
                   calc(5, true, "second"),
                   calc(1, true, "first")
               ]
           }
        })

        expect(await realize(obj.value)).toBe(true)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('sorts cases for switch', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $switch: {
                    cases: [
                        {
                            condition: calc(5, false, "second"),
                            value: "dontcare"
                        },
                        {
                            condition: calc(10, false, "third"),
                            value: "dontcare"
                        },
                        {
                            condition: calc(1, false, "first"),
                            value: "dontcare"
                        }
                    ],
                    default: 123
                }
           }
        })

        expect(await realize(obj.value)).toBe(123)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('calculates the cost on functions', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const values = []
        const resp = rulify({
            $or: [
                funcWithCost(() => (values.push(20), false), 20),
                funcWithCost(() => (values.push(5), false), 5),
                funcWithCost(() => (values.push(10), false), 10)
            ]
        })

        expect(await realize(resp)).toBe(false)

        expect(values).toMatchObject([5, 10, 20])
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

function funcWithCost(func, cost) {
    func[COST] = typeof cost === "number"
        ? () => cost
        : cost

    return {
        $fn: func
    }
}

async function rulifyWithCalc(value) {
    const messages = []
    let costCalls = 0

    async function calc(obj, api) {
        const realized = await api.realize(obj)
        messages.push(realized.message ?? realized.value)
        return realized.value
    }

    function calcCost(rawValue) {
        costCalls++
        return rawValue.cost
    }

    return {
        obj: await rulify({ 
            $handlers: { $calc: { fn: calc, cost: calcCost } }
            , ...value 
        }),
        messages,
        getCostCalls() { return costCalls }
    }
}

