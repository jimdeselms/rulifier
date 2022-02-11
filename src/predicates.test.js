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
    })
})
