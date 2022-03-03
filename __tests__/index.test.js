const { rulify, materialize } = require("../src")
const { delayed } = require("./helpers.test")

describe("rulify", () => {

    it("simplest case", async () => {
        const resp = rulify({ a: 5 })
        expect(await materialize(resp.a)).toBe(5)
    })

    it("simple chain", async () => {
        const resp = rulify({ a: { b: 5 } })

        expect(await materialize(resp.a.b)).toBe(5)
    })

    it("can handle merged objects, and later objects replace earlier ones", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        expect(await materialize(resp.a.b.c)).toBe(3)
    })

    it("can materialize a non-leaf node", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        expect(await materialize(resp.a.b)).toMatchObject({ c: 3 })
    })

    it("is harmless to await intermediate results", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        const b = await resp.a.b
        const c = resp.a.b.c

        expect(await materialize(b)).toMatchObject({ c: 3 })
        expect(await materialize(b.c)).toBe(3)
        expect(await materialize(c)).toBe(3)
    })

    it("can handle a thing that resolves to a function", async () => {
        const resp = rulify({ $fn: () => 100 })

        expect(await materialize(resp)).toEqual(100)
    })

    it("works with arrays of simple values", async () => {
        const resp = rulify({ arr: [1, 2] })

        expect(await materialize(resp.arr[0])).toBe(1)
//        expect(await materialize(resp.arr[1])).toBe(2)
    })

    it("can materialize an array", async () => {
        const resp = rulify({ a: [1, 2] })
        expect(await materialize(resp.a)).toMatchObject([1, 2])
    })

    it("works with arrays of functions", async () => {
        const resp = rulify({ a: [ { $fn: () => 1 }, { $fn: () => 2 }] })

        expect(await materialize(resp.a[0])).toBe(1)
        expect(await materialize(resp.a[1])).toBe(2)
    })

    it("works with an object that has a then that is not a promise", async () => {
        const resp = rulify({ then: 123 })

        expect(await materialize(resp.then)).toBe(123)
    })

    it("works with promises", async () => {
        const resp = rulify({ a: { $fn: () => delayed(500) }})

        expect(await materialize(resp.a)).toBe(500)
    })

    it("works with a chain of functions that return promises", async () => {
        const resp = rulify({
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

        expect(await materialize(resp.a.b.c)).toBe(12321)
    })

    it("can directly proxify a promise", async () => {
        const resp = rulify({ a: Promise.resolve(5) })

        expect(await materialize(resp.a)).toBe(5)
    })

    it("works with a chain of promises", async () => {
        const resp = rulify({
            a: delayed({
                b: delayed({
                    c: delayed(12321),
                }),
            }),
        })

        expect(await materialize(resp.a.b)).toMatchObject({c: 12321})
        expect(await materialize(resp.a.b.c)).toBe(12321)
    })

    it("works with a chain of functions", async () => {
        const resp = rulify({
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

        expect(await materialize(resp.a.b)).toMatchObject({c: { d: 12345} })
        expect(await materialize(resp.a.b.c)).toMatchObject({ d: 12345 })
        expect(await materialize(resp.a.b.c.d)).toBe(12345)
    })

    it("ensures that functions that are not referenced are not evaluated", async () => {
        let executed = false

        const resp = rulify({
            a: { $fn: () => 123 },
            b: { $fn: () => {
                executed = true
            }},
        })

        expect(await materialize(resp.a)).toBe(123)
        expect(executed).toBe(false)
    })

    it("ensures that functions only have to be executed a single time", async () => {
        let executed = 0

        const resp = rulify({
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

        expect(await materialize(resp.a.b)).toBe(1)
        expect(await materialize(resp.a.c)).toBe(2)
        expect(await materialize(resp.a.d)).toBe(3)

        expect(executed).toBe(1)
    })

    it("ensures that when the proxy is rebuilt, resolved values will be cleared", async () => {
        let executed = false

        const resp = rulify({
            a: {
                $fn: () => {
                    executed = true
                    return 5
                }
            }
        })

        expect(await materialize(resp.a)).toBe(5)
        expect(executed).toBe(true)

        executed = false

        const resp2 = rulify(resp)

        expect(await materialize(resp2.a)).toBe(5)
        expect(executed).toBe(true)
    })

    it("knows about handlers", async () => {
        const resp = rulify({
            $handlers: {
                capitalize: async (name) => (await materialize(name)).toUpperCase(),
            },
            name: {
                $capitalize: "Fred",
            },
        })

        expect(await materialize(resp.name)).toBe("FRED")
    })

    it("a response can have more data source added to it", async () => {
        const resp = rulify({ a: 1 })
        const resp2 = rulify(resp, { b: 2 })
        const resp3 = rulify(resp2, { c: 3 })

        expect(await materialize(resp3.a)).toBe(1)
        expect(await materialize(resp3.b)).toBe(2)
        expect(await materialize(resp3.c)).toBe(3)
    })

    it("a response can be enumerated without fully evaluating it", async () => {
        const resp = rulify({ a: [1, 2, 3] })

        const result = []

        for await (let i of resp.a) {
            result.push(await materialize(i))
        }

        expect(result).toMatchObject([1, 2, 3])
    })

    it("will not blow up if the object has a cycle, but not the value", async () => {
        const hasCycle = { value: 1 }
        hasCycle.hasCycle = hasCycle

        const resp = rulify(hasCycle)

        expect(await materialize(resp.hasCycle.hasCycle.value)).toBe(1)
    })

    it("throws an error if a cycle is detecting when realizing a value", async () => {
        const hasCycle = { value: 1 }
        hasCycle.hasCycle = hasCycle

        const resp = rulify(hasCycle)

        await expect(() => materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })

    it("throws an error if a cycle in a handler", async () => {
        const hasCycle = {}
        hasCycle.$or = [hasCycle]

        const resp = rulify(hasCycle)

        await expect(() => materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })

    it("throws an error if a cycle when calculating cost", async () => {
        const hasCycle = {}
        hasCycle.$or = [hasCycle, hasCycle, hasCycle]

        const resp = rulify(hasCycle)

        await expect(() => materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })
})
