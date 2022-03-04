import { Rulifier } from "../src"
import { delayed } from "./helpers.test"

describe("rulify", () => {

    it("simplest case", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: 5 })
        expect(await rulifier.materialize(resp.a)).toBe(5)
    })

    it("simple chain", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: { b: 5 } })

        expect(await rulifier.materialize(resp.a.b)).toBe(5)
    })

    it("can handle merged objects, and later objects replace earlier ones", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: { b: { c: 3 } } })

        expect(await rulifier.materialize(resp.a.b.c)).toBe(3)
    })

    it("can materialize a non-leaf node", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: { b: { c: 3 } } })

        expect(await rulifier.materialize(resp.a.b)).toMatchObject({ c: 3 })
    })

    it("is harmless to await intermediate results", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: { b: { c: 3 } } })

        const b = await resp.a.b
        const c = resp.a.b.c

        expect(await rulifier.materialize(b)).toMatchObject({ c: 3 })
        expect(await rulifier.materialize(b.c)).toBe(3)
        expect(await rulifier.materialize(c)).toBe(3)
    })

    it("can handle a thing that resolves to a function", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ $fn: () => 100 })

        expect(await rulifier.materialize(resp)).toEqual(100)
    })

    it("works with arrays of simple values", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ arr: [1, 2] })

        expect(await rulifier.materialize(resp.arr[0])).toBe(1)
        expect(await rulifier.materialize(resp.arr[1])).toBe(2)
    })

    it("can materialize an array", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: [1, 2] })
        expect(await rulifier.materialize(resp.a)).toMatchObject([1, 2])
    })

    it("works with arrays of functions", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: [ { $fn: () => 1 }, { $fn: () => 2 }] })

        expect(await rulifier.materialize(resp.a[0])).toBe(1)
        expect(await rulifier.materialize(resp.a[1])).toBe(2)
    })

    it("works with an object that has a then that is not a promise", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ then: 123 })

        expect(await rulifier.materialize(resp.then)).toBe(123)
    })

    it("works with promises", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: { $fn: () => delayed(500) }})

        expect(await rulifier.materialize(resp.a)).toBe(500)
    })

    it("works with a chain of functions that return promises", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            a: {
                $fn: () => delayed({
                    b: { 
                        $fn: () => delayed({
                            c: { $fn: () => delayed(12321) },
                        }),
                    }
                })
            },
        })

        expect(await rulifier.materialize(resp.a.b.c)).toBe(12321)
    })

    it("can directly proxify a promise", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: Promise.resolve(5) })

        expect(await rulifier.materialize(resp.a)).toBe(5)
    })

    it("works with a chain of promises", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            a: delayed({
                b: delayed({
                    c: delayed(12321),
                }),
            }),
        })

        expect(await rulifier.materialize(resp.a.b)).toMatchObject({c: 12321})
        expect(await rulifier.materialize(resp.a.b.c)).toBe(12321)
    })

    it("works with a chain of functions", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            a: { 
                $fn: () => ({
                    b: {
                        $fn: () => ({
                            c: {
                                $fn: () => ({d: 12345})
                            }
                        })
                    },
                }),
            }
        })

        expect(await rulifier.materialize(resp.a.b)).toMatchObject({c: { d: 12345} })
        expect(await rulifier.materialize(resp.a.b.c)).toMatchObject({ d: 12345 })
        expect(await rulifier.materialize(resp.a.b.c.d)).toBe(12345)
    })

    it("ensures that functions that are not referenced are not evaluated", async () => {
        let executed = false

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            a: { $fn: () => 123 },
            b: { $fn: () => {
                executed = true
            }},
        })

        expect(await rulifier.materialize(resp.a)).toBe(123)
        expect(executed).toBe(false)
    })

    it("ensures that functions only have to be executed a single time", async () => {
        let executed = 0

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            a: { 
                $fn: () => {
                    ++executed
                    return {
                        b: 1,
                        c: 2,
                        d: 3,
                    }
                }
            }
        })

        expect(await rulifier.materialize(resp.a.b)).toBe(1)
        expect(await rulifier.materialize(resp.a.c)).toBe(2)
        expect(await rulifier.materialize(resp.a.d)).toBe(3)

        expect(executed).toBe(1)
    })

    it("ensures that when the proxy is rebuilt, resolved values will be cleared", async () => {
        let executed = false

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            a: {
                $fn: () => {
                    executed = true
                    return 5
                }
            }
        })

        expect(await rulifier.materialize(resp.a)).toBe(5)
        expect(executed).toBe(true)

        executed = false

        const resp2 = rulifier.applyContext(resp)

        expect(await rulifier.materialize(resp2.a)).toBe(5)
        expect(executed).toBe(true)
    })

    it("knows about handlers", async () => {
        const rulifier = new Rulifier({
            handlers: {
                capitalize: async (name) => (await rulifier.materialize(name)).toUpperCase(),
            }
        })

        const resp = rulifier.applyContext({
            name: {
                $capitalize: "Fred",
            },
        })

        expect(await rulifier.materialize(resp.name)).toBe("FRED")
    })

    it("a response can have more data source added to it", async () => {
        const rulifier = new Rulifier({
            dataSources: [
                { a: 1 },
                { b: 2 },
                { c: 3 }
            ]
        })

        const resp = rulifier.applyContext()

        expect(await rulifier.materialize(resp.a)).toBe(1)
        expect(await rulifier.materialize(resp.b)).toBe(2)
        expect(await rulifier.materialize(resp.c)).toBe(3)
    })

    it("a response can be enumerated without fully evaluating it", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({ a: [1, 2, 3] })

        const result = []

        for await (let i of resp.a) {
            result.push(await rulifier.materialize(i))
        }

        expect(result).toMatchObject([1, 2, 3])
    })

    it("will not blow up if the object has a cycle, but not the value", async () => {
        const hasCycle = { value: 1 }
        hasCycle.hasCycle = hasCycle

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext(hasCycle)

        expect(await rulifier.materialize(resp.hasCycle.hasCycle.value)).toBe(1)
    })

    it("throws an error if a cycle is detecting when realizing a value", async () => {
        const hasCycle = { value: 1 }
        hasCycle.hasCycle = hasCycle

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext(hasCycle)

        await expect(() => rulifier.materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })

    it("throws an error if a cycle in a handler", async () => {
        const hasCycle = {}
        hasCycle.$or = [hasCycle]

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext(hasCycle)

        await expect(() => rulifier.materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })

    it("throws an error if a cycle when calculating cost", async () => {
        const hasCycle = {}
        hasCycle.$or = [hasCycle, hasCycle, hasCycle]

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext(hasCycle)

        await expect(() => rulifier.materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })
})
