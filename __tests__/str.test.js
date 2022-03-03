const { Rulifier } = require("../src")

describe("str", () => {
    it("can understand a simple string interpolation", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            thing: 123,
            value: { $str: "The value is ${thing}." },
        })

        expect(await rulifier.materialize(resp.value)).toBe("The value is 123.")
    })

    it("a null substitution is replaced by an empty string", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            thing: null,
            value: { $str: "No value here: (${thing})." },
        })

        expect(await rulifier.materialize(resp.value)).toBe("No value here: ().")
    })

    it("a undefined substitution is ignored", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            thing: undefined,
            value: { $str: "No replacement here: (${thing})." },
        })

        expect(await rulifier.materialize(resp.value)).toBe("No replacement here: (${thing}).")
    })

    it("a reference that isn't found is ignored", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            value: { $str: "No replacement here: (${thing})." },
        })

        expect(await rulifier.materialize(resp.value)).toBe("No replacement here: (${thing}).")
    })

    it("can handle multiple replacements in the same string", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            greeting: "Hello",
            customer: "Fred",
            today: "Sunday",
            value: { $str: "${greeting}, ${customer}! Have a great ${today}!" },
        })

        expect(await rulifier.materialize(resp.value)).toBe("Hello, Fred! Have a great Sunday!")
    })

    it("will escape substitutions that begin with a \\", async () => {
        const rulifier = new Rulifier()
        const resp = rulifier.applyContext({
            greeting: "Hello",
            value: { $str: "\\${greeting}, world!" },
        })

        expect(await rulifier.materialize(resp.value)).toBe("${greeting}, world!")
    })
})
