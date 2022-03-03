const { rulify, materialize } = require("../src")

describe("route", () => {
    it("can return the root route", async () => {
        const resp = await rulify({
            $route: returnPath
        })

        expect(await materialize(resp)).toMatchObject([])
    })

    it("can return a route with one accessor", async () => {
        const resp = await rulify({
            $route: returnPath
        })

        expect(await materialize(resp.a)).toMatchObject(['a'])
    })

    it("can return a route with multiple accessors", async () => {
        const resp = await rulify({
            $route: returnPath
        })

        expect(await materialize(resp.a.b.c)).toMatchObject(['a', 'b', 'c'])
    })

    it("can return a route with symbol accessors", async () => {
        const resp = await rulify({
            $route: returnPath
        })

        expect(await materialize(resp[Symbol.for("A")][Symbol.for("B")])).toMatchObject([Symbol.for("A"), Symbol.for("B")])
    })

    it("can return a route with numeric accessors", async () => {
        const resp = await rulify({
            $route: returnPath
        })

        expect(await materialize(resp[0][1])).toMatchObject(["0", "1"])
        expect(await materialize(resp["0"]["1"])).toMatchObject(["0", "1"])
    })
})

async function returnPath(path) {
    return path
}
