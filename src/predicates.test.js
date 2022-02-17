const { rulify } = require("../dist/index.cjs.js")
const { delayed } = require("./helpers.test.js")

describe("predicates", () => {
    describe("and", () => {
        it("returns true if everything is true", async () => {
            const resp = rulify({
                $and: [true, { $fn: () => true }, { $fn: () => delayed(true) }],
            })

            const result = await resp

            expect(result).toBe(true)
        })

        it("returns false if anything is false", async () => {
            const resp = rulify({
                $and: [true, { $fn: () => delayed(false) }, { $fn: () => true }],
            })

            const result = await resp

            expect(result).toBe(false)
        })
    })

    describe("or", () => {
        it("returns true if one thing is true", async () => {
            const resp = rulify({
                $or: [delayed(false), delayed(false), { $fn: () => delayed(true) }],
            })

            const result = await resp

            expect(result).toBe(true)
        })

        it("returns false if everything is false", async () => {
            const resp = rulify({
                $and: [delayed(false), delayed(false), { $fn: () => delayed(false) }],
            })

            const result = await resp

            expect(result).toBe(false)
        })
    })

    describe("not", () => {
        it("negates the value", async () => {
            expect(await rulify({ $not: true })).toBe(false)
            expect(await rulify({ $not: false })).toBe(true)
            expect(await rulify({ $not: delayed(1) })).toBe(false)
            expect(await rulify({ $not: delayed(0) })).toBe(true)
        })

        it("returns false if everything is false", async () => {
            const resp = rulify({
                $and: [delayed(false), delayed(false), { $fn: () => delayed(false) }],
            })

            const result = await resp

            expect(result).toBe(false)
        })
    })

    test("binary operators", async () => {
        expect(await rulify({ $lt: [5, 10] })).toBe(true)
        expect(await rulify({ $lt: [15, 10] })).toBe(false)

        expect(await rulify({ $lte: [9, 10] })).toBe(true)
        expect(await rulify({ $lte: [10, 10] })).toBe(true)
        expect(await rulify({ $lte: delayed([11, 10]) })).toBe(false)

        expect(await rulify({ $gt: [5, delayed(10)] })).toBe(false)
        expect(await rulify({ $gt: [5, 10] })).toBe(false)
        expect(await rulify({ $gt: [15, 10] })).toBe(true)

        expect(await rulify({ $gte: [9, 10] })).toBe(false)
        expect(await rulify({ $gte: [10, { $fn: () => 10 }] })).toBe(true)
        expect(await rulify({ $gte: [11, 10] })).toBe(true)

        expect(await rulify({ $eq: [5, delayed(5)] })).toBe(true)
        expect(await rulify({ $eq: [5, 10] })).toBe(false)

        expect(await rulify({ $ne: [5, 5] })).toBe(false)
        expect(await rulify({ $ne: [5, 10] })).toBe(true)
    })

    test("binary match", async () => {
        expect(
            await rulify(
                {
                    $handlers: {
                        async $capitalize(str) {
                            return (await str).toUpperCase()
                        },
                    },
                },
                {
                    $match: [
                        {
                            name: "Fred",
                            details: {
                                friends: { $fn: () => delayed(["BILL", "STEVE"]) },
                            },
                        },
                        {
                            name: "Fred",
                            details: {
                                friends: [{ $capitalize: "bill" }, { $capitalize: "steve" }],
                            },
                        },
                    ],
                }
            )
        ).toBe(true)

        expect(
            await rulify(
                {
                    $handlers: {
                        async $capitalize(str) {
                            return (await str).toUpperCase()
                        },
                    },
                },
                {
                    $match: [
                        {
                            name: "Fred",
                            details: {
                                friends: () => delayed(["TED", "STEVE"]),
                            },
                        },
                        {
                            name: "Fred",
                            details: {
                                friends: [{ $capitalize: "bill" }, { $capitalize: "steve" }],
                            },
                        },
                    ],
                }
            )
        ).toBe(false)
    })

    describe("match", () => {
        it("understands simple rules", async () => {
            const resp = rulify({
                name: "Jim",
                age: 29,
                value: {
                    $match: {
                        name: "Jim",
                        age: 29,
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns true the current value is less than the given value", async () => {
            const resp = rulify({
                age: 32,
                name: "Fred",
                value: {
                    $match: {
                        name: "Fred",
                        age: { $lt: 35 },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false the current value is not less than the given value", async () => {
            const resp = rulify({
                age: 35,
                value: {
                    $match: {
                        age: { $lt: 32 },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("returns true if the current value matches the regex", async () => {
            const resp = rulify({
                name: "FRED",
                value: {
                    $match: {
                        name: /ed/i,
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false if the current value matches the regex", async () => {
            const resp = rulify({
                name: "Bill",
                value: {
                    $match: {
                        name: /ed/,
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("returns true if the current value matches a regex string", async () => {
            const resp = rulify({
                name: "Fred",
                value: {
                    $match: {
                        name: { $regex: "ed" },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false if the current value does not match a regex string", async () => {
            const resp = rulify({
                name: "Bill",
                value: {
                    $match: {
                        name: { $regex: "ed" },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("returns true if the current value matches a regex with parameters", async () => {
            const resp = rulify({
                name: "Fred",
                value: {
                    $match: {
                        name: { $regex: { pattern: "ED", flags: "i" } },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("returns false if the current value does not match a regex with parameters", async () => {
            const resp = rulify({
                name: "Bill",
                value: {
                    $match: {
                        name: { $regex: { pattern: "ed", flags: "i" } },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("true if in", async () => {
            const resp = rulify({
                age: 35,
                value: {
                    $match: {
                        age: { $in: [30, 35, 40] },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("false if not in", async () => {
            const resp = rulify({
                age: 34,
                value: {
                    $match: {
                        age: { $in: [30, 35, 40] },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("can match arrays", async () => {
            const resp = rulify({
                arr: [5, 10, 15],
                value: {
                    $match: {
                        arr: [5, 10, 15],
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("can't match arrays that are different", async () => {
            const resp = rulify({
                arr: [5, 10, 12],
                value: {
                    $match: {
                        arr: [5, 10, 15],
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })

        it("deep equality match true if objects match", async () => {
            const resp = rulify({
                thing: {
                    color: "Blue",
                    details: {
                        size: "Large",
                        dimensions: {
                            width: 10,
                            height: 20,
                        },
                    },
                },
                value: {
                    $match: {
                        thing: {
                            color: "Blue",
                            details: {
                                size: "Large",
                                dimensions: {
                                    width: 10,
                                    height: { $lt: 21 },
                                },
                            },
                        },
                    },
                },
            })

            expect(await resp.value).toBe(true)
        })

        it("failed deep equality match if objects have differences", async () => {
            const resp = rulify({
                thing: {
                    color: "Blue",
                    details: {
                        size: "Large",
                        dimensions: {
                            width: 10,
                            height: 20,
                        },
                    },
                },
                value: {
                    $match: {
                        thing: {
                            color: "Blue",
                            details: {
                                size: "Large",
                                dimensions: {
                                    width: 10,
                                    height: 21,
                                },
                            },
                        },
                    },
                },
            })

            expect(await resp.value).toBe(false)
        })
    })
})
