const { buildResponse } = require("./index.js")

describe("buildResponse", () => {
    it("simple chain", async () => {
        const resp = buildResponse({a: { b: 5 }})

        expect(await resp.a.b).toBe(5)
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

    it("works with arrays of functions", async () => {
        const resp = buildResponse([ () => 1, () => 2 ])

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

    it("works with a chain of functions that return promises", async () => {
        const resp = buildResponse(
            { 
                a: () => delayed({
                    b: () => delayed({
                        c: () => delayed(12321)
                    })
                })
            }
        )

        expect(await resp.a.b.c).toBe(12321)
    })

    it("works with a chain of promises", async () => {
        const resp = buildResponse(
            { 
                a: delayed({
                    b: delayed({
                        c: delayed(12321)
                    })
                })
            }
        )

        expect(await resp.a.b.c).toBe(12321)
    })

    it("works with a chain of functions", async () => {
        const resp = buildResponse({ 
            a: () => ({
                b: () => ({
                    c: () => 12345
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

    it("ensures that functions that aren't referenced aren't evaluated", async () => {
        let executed = false

        const resp = buildResponse({
            a: () => 123,
            b: () => { 
                executed = true
            }
        })

        expect(await resp.a).toBe(123)
        expect(executed).toBe(false)
    })

    it("ensures that functions only have to be executed a single time", async () => {
        let executed = 0

        const resp = buildResponse({
            a: () => {
                ++executed
                return {
                    b: 1,
                    c: 2,
                    d: 3
                }
            }
        })

        expect(await resp.a.b).toBe(1)
        expect(await resp.a.c).toBe(2)
        expect(await resp.a.d).toBe(3)

        expect(executed).toBe(1)
    })

    it("knows about directives", async () => {
        const resp = buildResponse({
            $directives: {
                capitalize: (name) => name.toUpperCase()
            },
            name: {
                $capitalize: "Fred"
            }
        })

        expect(await resp.name).toBe("FRED")
    })

    it("a response can have more context added to it", async () => {
        const resp = buildResponse({a: 1})
        const resp2 = buildResponse(resp, {b: 2})
        const resp3 = buildResponse(resp2, { c: 3 })

        expect(await resp3.a).toBe(1)
        expect(await resp3.b).toBe(2)
        expect(await resp3.c).toBe(3)
    })
})

async function delayed(response) {
    await new Promise(r => setTimeout(r, 1))
    return response
}

module.exports = {
    delayed
}