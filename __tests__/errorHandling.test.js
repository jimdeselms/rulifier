const { rulify, materialize } = require("../src")

describe("errorHandling", () => {
    it("will bubble up an exception if a handler throws an exception", async () => {
        const resp = rulifyWithThrow({ err: { $throw: "ERROR" }})

        try {
            await materialize(resp.err)
            throw new Error("Expected to throw")
        } catch (err) {
            expect(err).toBe("ERROR")
        }
    })

    it("will throw an exception if the root object handler an exception", async () => {
        const resp = rulifyWithThrow({ $throw: "ERROR" })

        try {
            await materialize(resp)
            throw new Error("Expected to throw")
        } catch(err) {
            expect(err).toBe("ERROR")
        }
    })

    it("will not throw an exception if you don't reference a handler that would throw an exception", async () => {
        const resp = rulifyWithThrow({ value: 1, err: { $throw: "ERROR" }})

        expect(await materialize(resp.value)).toBe(1)
    })
})

function rulifyWithThrow(value) {
    async function $throw(obj, api) {
        const materialized = await api.materialize(obj)
        throw materialized
    }

    return rulify({ 
        $handlers: { $throw },
        ...value
    })
}

