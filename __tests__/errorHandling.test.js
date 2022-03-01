import { rulify, realize } from "../src"

describe("errorHandling", () => {
    it("will bubble up an exception if a handler throws an exception", async () => {
        const resp = rulifyWithThrow({ err: { $throw: "ERROR" }})

        expect(() => realize(resp.err)).rejects.toThrow("ERROR")
    })

    it("will throw an exception if the root object handler an exception", async () => {
        const resp = rulifyWithThrow({ $throw: "ERROR" })

        expect(() => realize(resp)).rejects.toThrow("ERROR")
    })

    it("will not throw an exception if you don't reference a handler that would throw an exception", async () => {
        const resp = rulifyWithThrow({ value: 1, err: { $throw: "ERROR" }})

        expect(await realize(resp.value)).toBe(1)
    })
})

function rulifyWithThrow(value) {
    async function $throw(obj, api) {
        debugger
        const realized = await api.realize(obj)
        throw realized
    }

    return rulify({ 
        $handlers: { $throw },
        ...value
    })
}

