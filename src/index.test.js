const { buildResponse } = require("./index.js")

describe("buildResponse", () => {
    it("works", async () => {
        const resp = buildResponse({a: 1, b: { c: 3 }})

        expect(await resp.a).toBe(1)
        expect(await resp.b.c).toBe(3)
    })

    it("can handle merged objects, and later objects replace earlier ones", async () => {
        const resp = buildResponse({a: {b: { c: 3}}})

        expect(await resp.a.b.c).toBe(3)
    })

    it("is harmless to await intermediate results", async () => {
        const resp = await buildResponse({a: {b: { c: 3}}})
 
        const a = await resp.a
        const b = await a.b
        const c = await b.c

        expect(c).toBe(3)
    })

    it("works with arrays", async () => {
        const resp = buildResponse([1, 2])

        expect(await resp[0]).toBe(1)
        expect(await resp[1]).toBe(2)
    })

    it("works with an object that has a then that isn't a promise", async () => {
        const resp = buildResponse({ then: 123 })

        expect(await resp.then).toBe(123)
    })

    it("works with functions", async () => {
        const resp = buildResponse({ a: 5000 })

        expect(await resp.a).toBe(5000)
    })

    it("works with promises", async () => {
        const resp = buildResponse({ a: () => delayed(500) })

        expect(await resp.a).toBe(500)
    })

    it("works with a chain of promises", async () => {
        const resp = buildResponse(
            { 
                a: () => ({
                    b: delayed(500) 
                })
            }
        )

        expect(await resp.a.b).toBe(500)
    })

    it("works with a chain of functions", async () => {
        const resp = buildResponse({ 
            a: () => ({
                b: () => ({
                    c: 12345
                })
            })
        })

        expect(await resp.a.b.c).toBe(12345)
    })

    it("works with a function that returns a simple object", async () => {
        const resp = buildResponse({ 
            a: () => 123
        })

        expect(await resp.a).toBe(123)
    })
})

async function delayed(response) {
    await new Promise(r => setTimeout(r, 1))
    return response
}