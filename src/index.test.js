import { rulify, evaluate } from "./index"
import { delayed } from "./helpers.test"

describe("rulify", () => {

    it("simplest case", async () => {
        const resp = rulify({ a: 5 })
        expect(await evaluate(resp.a)).toBe(5)
    })

    it("simple chain", async () => {
        const resp = rulify({ a: { b: 5 } })

        expect(await evaluate(resp.a.b)).toBe(5)
    })

    it("can handle merged objects, and later objects replace earlier ones", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        expect(await evaluate(resp.a.b.c)).toBe(3)
    })

    it("can materialize a non-leaf node", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        expect(await evaluate(resp.a.b)).toMatchObject({ c: 3 })
    })

    it("is harmless to await intermediate results", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        const b = await resp.a.b
        const c = resp.a.b.c

        expect(await evaluate(b)).toMatchObject({ c: 3 })
        expect(await evaluate(b.c)).toBe(3)
        expect(await evaluate(c)).toBe(3)
    })

    it("can handle a thing that resolves to a function", async () => {
        const resp = rulify({ $fn: () => 100 })

        expect(await evaluate(resp)).toEqual(100)
    })

    it("works with arrays of simple values", async () => {
        const resp = rulify({ arr: [1, 2] })

        expect(await evaluate(resp.arr[0])).toBe(1)
//        expect(await evaluate(resp.arr[1])).toBe(2)
    })

    it("can materialize an array", async () => {
        const resp = rulify({ a: [1, 2] })
        expect(await evaluate(resp.a)).toMatchObject([1, 2])
    })

    it("works with arrays of functions", async () => {
        const resp = rulify({ a: [ { $fn: () => 1 }, { $fn: () => 2 }] })

        expect(await evaluate(resp.a[0])).toBe(1)
        expect(await evaluate(resp.a[1])).toBe(2)
    })

    it("works with an object that has a then that is not a promise", async () => {
        const resp = rulify({ then: 123 })

        expect(await evaluate(resp.then)).toBe(123)
    })

    it("works with promises", async () => {
        const resp = rulify({ a: { $fn: () => delayed(500) }})

        expect(await evaluate(resp.a)).toBe(500)
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

        expect(await evaluate(resp.a.b.c)).toBe(12321)
    })

    it("can directly proxify a promise", async () => {
        const resp = rulify({ a: Promise.resolve(5) })

        expect(await evaluate(resp.a)).toBe(5)
    })

    it("works with a chain of promises", async () => {
        const resp = rulify({
            a: delayed({
                b: delayed({
                    c: delayed(12321),
                }),
            }),
        })

        expect(await evaluate(resp.a.b)).toMatchObject({c: 12321})
        expect(await evaluate(resp.a.b.c)).toBe(12321)
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

        expect(await evaluate(resp.a.b)).toMatchObject({c: { d: 12345} })
        expect(await evaluate(resp.a.b.c)).toMatchObject({ d: 12345 })
        expect(await evaluate(resp.a.b.c.d)).toBe(12345)
    })

    it("ensures that functions that are not referenced are not evaluated", async () => {
        let executed = false

        const resp = rulify({
            a: { $fn: () => 123 },
            b: { $fn: () => {
                executed = true
            }},
        })

        expect(await evaluate(resp.a)).toBe(123)
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

        expect(await evaluate(resp.a.b)).toBe(1)
        expect(await evaluate(resp.a.c)).toBe(2)
        expect(await evaluate(resp.a.d)).toBe(3)

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

        expect(await evaluate(resp.a)).toBe(5)
        expect(executed).toBe(true)

        executed = false

        const resp2 = rulify(resp)

        expect(await evaluate(resp2.a)).toBe(5)
        expect(executed).toBe(true)
    })

    it("knows about handlers", async () => {
        debugger
        const resp = rulify({
            $handlers: {
                capitalize: async (name) => (await evaluate(name)).toUpperCase(),
            },
            name: {
                $capitalize: "Fred",
            },
        })

        expect(await evaluate(resp.name)).toBe("FRED")
    })

    it("a response can have more data source added to it", async () => {

        debugger 

        const resp = rulify({ a: 1 })
        const resp2 = rulify(resp, { b: 2 })
        const resp3 = rulify(resp2, { c: 3 })

        expect(await evaluate(resp3.a)).toBe(1)
        expect(await evaluate(resp3.b)).toBe(2)
        expect(await evaluate(resp3.c)).toBe(3)
    })
})
