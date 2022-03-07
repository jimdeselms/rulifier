import { Rulifier } from "../src"
import { COST } from '../src/symbols'

describe('calculateCost', () => {
    it('calculates the cost of nodes and executes cheapest first', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, rulifier, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(10, false, "third"),
                   calc(5, false, "second"),
                   calc(1, false, "first")
               ]
           }
        })

        expect(await rulifier.materialize(obj.value)).toBe(false)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('calculates the cost of based on complexity', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, rulifier, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(1, { $or:  [false, false]}, "third"),
                   calc(1, { $or: [false]}, "second"),
                   calc(1, false, "first")
               ]
           }
        })

        expect(await rulifier.materialize(obj.value)).toBe(false)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('short circuits if a cheaper node is true', async () => {
        // In this case, since the first is cheapest -- and true -- it short circuits
        // so that the other nodes don't have to be evaluated
        const { obj, rulifier, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(10, false, "third"),
                   calc(5, false, "second"),
                   calc(1, true, "first")
               ]
           }
        })

        expect(await rulifier.materialize(obj.value)).toBe(true)

        expect(messages).toMatchObject(["first"])
        expect(getCostCalls()).toBe(3)
    })

    it('does not bother sorting if there is only one value', async () => {
        // In this case, since the first is cheapest -- and true -- it short circuits
        // so that the other nodes don't have to be evaluated
        const { obj, rulifier, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $or: [ 
                   calc(1, true, "first")
               ]
           }
        })

        expect(await rulifier.materialize(obj.value)).toBe(true)

        expect(messages).toMatchObject(["first"])
        expect(getCostCalls()).toBe(0)
    })

    it('sorts nodes for and', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, rulifier, messages, getCostCalls } = await rulifyWithCalc({
           value: {
               $and: [ 
                   calc(10, true, "third"),
                   calc(5, true, "second"),
                   calc(1, true, "first")
               ]
           }
        })

        expect(await rulifier.materialize(obj.value)).toBe(true)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('sorts cases for switch', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, rulifier, messages, getCostCalls } = await rulifyWithCalc({
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

        expect(await rulifier.materialize(obj.value)).toBe(123)

        expect(messages).toMatchObject(["first", "second", "third"])
        expect(getCostCalls()).toBe(3)
    })

    it('calculates the cost on functions', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const values = []
        const rulifier = new Rulifier({
            dataSources: [
                {
                    $or: [
                        funcWithCost(() => (values.push(20), false), 20),
                        funcWithCost(() => (values.push(5), false), 5),
                        funcWithCost(() => (values.push(10), false), 10)
                    ]
                }
            ]
        })

        const resp = rulifier.applyContext()

        expect(await rulifier.materialize(resp)).toBe(false)

        expect(values).toMatchObject([5, 10, 20])
    })

    it('calculates the cost when comparing objects', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, rulifier, messages } = await rulifyWithCalc({
            value: {
                $eq: [
                    { 
                        name: calc(10, "Fred", "second"),
                        age: calc(1, 20, "first")
                    },
                    { 
                        name: calc(10, "Fred", "second"),
                        age: calc(1, 20, "first")
                    }
                ]
            }
         })

         expect(await rulifier.materialize(obj.value)).toBe(true)

         expect(messages).toMatchObject(["first", "first", "second", "second"])
     })

     it('sums the costs of both values when calculating costs when comparing objects', async () => {
        // In this case, all the nodes are false, but at least we execute them in
        // order of cost
        const { obj, rulifier, messages } = await rulifyWithCalc({
            value: {
                $eq: [
                    { 
                        name: calc(5, "Fred", "first"),
                        age: calc(10, 20, "fourth"),
                        city: calc(15, "Springfield", "third"),
                        zipCode: calc(1, 20, "second")
                    },
                    { 
                        name: calc(5, "Fred", "first"),
                        age: calc(9, 20, "fourth"),
                        city: calc(2, "Springfield", "third"),
                        zipCode: calc(10, 20, "second")
                    }
                ]
            }
         })

         expect(await rulifier.materialize(obj.value)).toBe(true)
 
         expect(messages).toMatchObject(["first", "first", "second", "second", "third", "third", "fourth", "fourth"])
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
    func[COST] = cost

    return {
        $fn: func
    }
}

async function rulifyWithCalc(value) {
    const messages = []
    let costCalls = 0

    async function calc(obj, api) {
        const materialized = await api.materialize(obj)
        messages.push(materialized.message ?? materialized.value)
        return materialized.value
    }

    function calcCost(rawValue) {
        costCalls++
        return rawValue.cost
    }
    
    const rulifier = new Rulifier({
        dataSources: [ value ],
        handlers: { 
            $calc: { fn: calc, cost: calcCost }
        }
    })

    const obj = rulifier.applyContext({})

    return {
        obj,
        rulifier,
        messages,
        getCostCalls() { return costCalls }
    }
}

