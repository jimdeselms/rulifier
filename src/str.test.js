const { buildResponse } = require("./index.js")
const { delayed } = require("./index.test.js")

describe("str", () => {
    it("can understand a simple string interpolation", async () => {
        const resp = await buildResponse({
            thing: 123,
            value: { $str: "The value is ${thing}." },
        })

        expect(await resp.value).toBe("The value is 123.")
    })

    it("a null substitution is replaced by an empty string", async () => {
        const resp = await buildResponse({
            thing: null,
            value: { $str: "No value here: (${thing})." },
        })

        expect(await resp.value).toBe("No value here: ().")
    })

    it("a undefined substitution is ignored", async () => {
        const resp = await buildResponse({
            thing: undefined,
            value: { $str: "No replacement here: (${thing})." },
        })

        expect(await resp.value).toBe("No replacement here: (${thing}).")
    })

    it("a reference that isn't found is ignored", async () => {
        const resp = await buildResponse({
            value: { $str: "No replacement here: (${thing})." },
        })

        expect(await resp.value).toBe("No replacement here: (${thing}).")
    })

    it("can handle multiple replacements in the same string", async () => {
        const resp = await buildResponse({
            greeting: "Hello",
            customer: "Fred",
            today: "Sunday",
            value: { $str: "${greeting}, ${customer}! Have a great ${today}!" },
        })

        expect(await resp.value).toBe("Hello, Fred! Have a great Sunday!")
    })
})

