import { Rulifier } from "../src"

describe("errorHandling", () => {
    it("will bubble up an exception if a rule throws an exception", async () => {
        const rulifier = new Rulifier({
            rules: { $throw }
        })

        const resp = rulifier.applyContext({ err: { $throw: "ERROR" }})

        try {
            await rulifier.materialize(resp.err)
            throw new Error("Expected to throw")
        } catch (err) {
            expect(err).toBe("ERROR")
        }
    })

    it("will throw an exception if the root object rule an exception", async () => {
        const rulifier = new Rulifier({
            rules: { $throw }
        })

        const resp = rulifier.applyContext({ $throw: "ERROR" })

        try {
            await rulifier.materialize(resp)
            throw new Error("Expected to throw")
        } catch(err) {
            expect(err).toBe("ERROR")
        }
    })

    it("will not throw an exception if you don't reference a rule that would throw an exception", async () => {
        const rulifier = new Rulifier({
            rules: { $throw }
        })

        const resp = rulifier.applyContext({ value: 1, err: { $throw: "ERROR" }})

        expect(await rulifier.materialize(resp.value)).toBe(1)
    })
})

async function $throw(obj, api) {
    const materialized = await api.materialize(obj)
    throw materialized
}
