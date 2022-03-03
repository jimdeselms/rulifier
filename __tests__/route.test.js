const { Rulifier } = require("../src")

describe("route", () => {
    it("can return the root route", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            $route: returnPath
        })

        expect(await rulifier.materialize(resp)).toMatchObject([])
    })

    it("can return a route with one accessor", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            $route: returnPath
        })

        expect(await rulifier.materialize(resp.a)).toMatchObject(['a'])
    })

    it("can return a route with multiple accessors", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            $route: returnPath
        })

        expect(await rulifier.materialize(resp.a.b.c)).toMatchObject(['a', 'b', 'c'])
    })

    it("can return a route with symbol accessors", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            $route: returnPath
        })

        expect(await rulifier.materialize(resp[Symbol.for("A")][Symbol.for("B")])).toMatchObject([Symbol.for("A"), Symbol.for("B")])
    })

    it("can return a route with numeric accessors", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            $route: returnPath
        })

        expect(await rulifier.materialize(resp[0][1])).toMatchObject(["0", "1"])
        expect(await rulifier.materialize(resp["0"]["1"])).toMatchObject(["0", "1"])
    })
})

async function returnPath(path) {
    return path
}
