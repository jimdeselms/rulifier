import { rulify } from "./index"
import { delayed } from "./helpers.test"

describe("rulify", () => {

    it("simplest case", async () => {
        const resp = rulify({ a: 5 })
        expect(await resp.a.value()).toBe(5)
    })
    it("simple chain", async () => {
        const resp = rulify({ a: { b: 5 } })

        expect(await resp.a.b.value()).toBe(5)
    })

    it("can handle merged objects, and later objects replace earlier ones", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        expect(await resp.a.b.c.value()).toBe(3)
    })

    it("is harmless to await intermediate results", async () => {
        const resp = rulify({ a: { b: { c: 3 } } })

        debugger

        const a1 = await resp.a.b.c
        const a2 = resp.a.b.c

        expect(await a.value()).toBe(3)
    })

    it("can handle a thing that resolves to a function", async () => {
        const result = rulify({ $fn: () => 100 })
        const valueFn = result.value
        const value = valueFn()
        const resp = await value

        expect(resp).toEqual(100)
    })

    it("works with arrays", async () => {
        const resp = rulify([1, 2])

        expect(await resp[0].value()).toBe(1)
        expect(await resp[1].value()).toBe(2)
    })

    it("works with arrays of functions", async () => {
        const resp = rulify([ { $fn: () => 1 }, { $fn: () => 2 }])

        expect(await resp[0].value()).toBe(1)
        expect(await resp[1].value()).toBe(2)
    })

    it("works with an object that has a then that is not a promise", async () => {
        const resp = rulify({ then: 123 })

        expect(await resp.then.value()).toBe(123)
    })

    it("works with promises", async () => {
        const resp = rulify({ a: { $fn: () => delayed(500) }})

        expect(await resp.a.value()).toBe(500)
    })

    // it("works with a chain of functions that return promises", async () => {
    //     const resp = rulify({
    //         a: {
    //             $fn: () => delayed({
    //                 b: { 
    //                     $fn: () => delayed({
    //                         c: { $fn: () => delayed(12321) },
    //                     }),
    //                 }
    //             })
    //         },
    //     })

    //     expect(await resp.a.b.c.value()).toBe(12321)
    // })

    // it("works with a chain of promises", async () => {
    //     const resp = rulify({
    //         a: delayed({
    //             b: delayed({
    //                 c: delayed(12321),
    //             }),
    //         }),
    //     })

    //     expect(await resp.a.b.c).toBe(12321)
    // })

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

        debugger

        const respVal = await resp 

        debugger 

        const a = resp.a
        const aVal = await a

        debugger

        const b = a.b
        const bVal = await b

        debugger

        const c = b.c
        const cVal = await c

        debugger 

        const d = c.d
        const dVal = await d

        await new Promise(r => setTimeout(r, 100))

        const valueFn = b.value
        const result = valueFn()

        expect(await result).toMatchObject({c: { d: 12345} })
    }, 9999999)

    it("works with a function that returns a simple object", async () => {
        const resp = rulify({
            a: { $fn: () => 123 },
        })

        expect(await resp.a.value()).toBe(123)
    })

    // it("ensures that functions that aren't referenced aren't evaluated", async () => {
    //     let executed = false

    //     const resp = rulify({
    //         a: { $fn: () => 123 },
    //         b: { $fn: () => {
    //             executed = true
    //         }},
    //     })

    //     expect(await resp.a).toBe(123)
    //     expect(executed).toBe(false)
    // })

    // it("ensures that functions only have to be executed a single time", async () => {
    //     let executed = 0

    //     const resp = rulify({
    //         a: { 
    //             $fn: () => {
    //                 ++executed
    //                 return {
    //                     b: 1,
    //                     c: 2,
    //                     d: 3,
    //                 }
    //             }
    //         }
    //     })

    //     expect(await resp.a.b).toBe(1)
    //     expect(await resp.a.c).toBe(2)
    //     expect(await resp.a.d).toBe(3)

    //     expect(executed).toBe(1)
    // })

    // it("ensures that when the proxy is rebuilt, resolved values will be cleared", async () => {
    //     let executed = false

    //     const resp = rulify({
    //         a: {
    //             $fn: () => {
    //                 executed = true
    //                 return 5
    //             }
    //         }
    //     })

    //     expect(await resp.a).toBe(5)
    //     expect(executed).toBe(true)

    //     executed = false

    //     const resp2 = rulify(resp)

    //     expect(await resp2.a).toBe(5)
    //     expect(executed).toBe(true)
    // })

    // it("knows about handlers", async () => {
    //     const resp = rulify({
    //         $handlers: {
    //             capitalize: (name) => name.toUpperCase(),
    //         },
    //         name: {
    //             $capitalize: "Fred",
    //         },
    //     })

    //     expect(await resp.name).toBe("FRED")
    // })

    // it("a response can have more data source added to it", async () => {
    //     const resp = rulify({ a: 1 })
    //     const resp2 = rulify(resp, { b: 2 })
    //     const resp3 = rulify(resp2, { c: 3 })

    //     expect(await resp3.a).toBe(1)
    //     expect(await resp3.b).toBe(2)
    //     expect(await resp3.c).toBe(3)
    // })
})
