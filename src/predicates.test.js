const { buildResponse } = require("./index.js")
const { delayed } = require("./index.test.js")

describe("predicates", () => {
    describe("and", () => {
        it("returns true if everything is true", async () => {
            const resp = buildResponse({
                $and: [true, () => true, () => delayed(true)],
            })

            const result = await resp

            expect(result).toBe(true)
        })

        it("returns false if anything is false", async () => {
            const resp = buildResponse({
                $and: [true, () => delayed(false), () => true],
            })

            const result = await resp

            expect(result).toBe(false)
        })
    })

    describe("rule", () => {
        it("understands simple rules", async () => {
            const resp = buildResponse({
                name: "Jim",
                age: 29,
                value: {
                    $rule: {
                        name: "Jim",
                        age: 29,
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns true the current value is less than the given value", async () => {
            const resp = buildResponse({
                age: 32,
                value: {
                    $rule: {
                        age: { $lt: 35 },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false the current value is not less than the given value", async () => {
            const resp = buildResponse({
                age: 35,
                value: {
                    $rule: {
                        age: { $lt: 32 },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("returns true if the current value matches the regex", async () => {
            const resp = buildResponse({
                name: "FRED",
                value: {
                    $rule: {
                        name: /ed/i,
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false if the current value matches the regex", async () => {
            const resp = buildResponse({
                name: "Bill",
                value: {
                    $rule: {
                        name: /ed/,
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("returns true if the current value matches a regex string", async () => {
            const resp = buildResponse({
                name: "Fred",
                value: {
                    $rule: {
                        name: { $regex: "ed" },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false if the current value does not match a regex string", async () => {
            const resp = buildResponse({
                name: "Bill",
                value: {
                    $rule: {
                        name: { $regex: "ed" },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("returns true if the current value matches a regex with parameters", async () => {
            const resp = buildResponse({
                name: "Fred",
                value: {
                    $rule: {
                        name: { $regex: { pattern: "ED", flags: "i" } },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false if the current value does not match a regex with parameters", async () => {
            const resp = buildResponse({
                name: "Bill",
                value: {
                    $rule: {
                        name: { $regex: { pattern: "ed", flags: "i" } },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("true if in", async () => {
            const resp = buildResponse({
                age: 35,
                value: {
                    $rule: {
                        age: { $in: [30, 35, 40] }
                    }
                }
            })

            expect(await resp.value).toBe(true)
        })
        
        it("false if not in", async () => {
            const resp = buildResponse({
                age: 34,
                value: {
                    $rule: {
                        age: { $in: [30, 35, 40] }
                    }
                }
            })

            expect(await resp.value).toBe(false)
        })
    })
})
