const { rulify, materialize } = require("../src")
const { delayed } = require("./helpers.test")

describe("predicates", () => {
    describe("$and", () => {
        it("returns true if everything is true", async () => {
            const resp = rulify({
                $and: [{ $fn: () => true }, { $fn: () => delayed(true) }, true],
            })

            const result = await materialize(resp)

            expect(result).toBe(true)
        })

        it("returns false if anything is false", async () => {
            const resp = rulify({
                $and: [{ $fn: () => delayed(false) }, { $fn: () => true }, true],
            })

            const result = await materialize(resp)

            expect(result).toBe(false)
        })

        it("can handle nested ands", async () => {
            const resp = rulify({
                $and: [
                    { 
                        $fn: () => ({ $and: [true, { $fn: () => true }] })
                    },
                    {
                        $and: [true, true]
                    }
                ]
            })

            const result = await materialize(resp)

            expect(result).toBe(true)
        })

        it("returns true if there are no options", async () => {
            // And is if every one of its options is true. If there are no options,
            // then it is true. (This is the same behavior as Scheme.)
            const resp = rulify({
                $and: [],
            })

            const result = await materialize(resp)

            expect(result).toBe(true)
        })
    })

    describe("$or", () => {
        it("returns true if one thing is true", async () => {
            const resp = rulify({
                $or: [delayed(false), delayed(false), { $fn: () => delayed(true) }],
            })

            const result = await materialize(resp)

            expect(result).toBe(true)
        })

        it("returns false if everything is false", async () => {
            const resp = rulify({
                $or: [delayed(false), delayed(false), { $fn: () => delayed(false) }],
            })

            const result = await materialize(resp)

            expect(result).toBe(false)
        })

        it("returns false if there are no options", async () => {
            // Or is true if any of its options are false, so, if there are no options,
            // it is false. (This is the same behavior as Scheme.)
            const resp = rulify({
                $or: [],
            })

            const result = await materialize(resp)

            expect(result).toBe(false)
        })
    })

    describe("$not", () => {
        it("negates the value", async () => {
            expect(await materialize(rulify({ $not: true }))).toBe(false)
            expect(await materialize(rulify({ $not: false }))).toBe(true)
            expect(await materialize(rulify({ $not: delayed(1) }))).toBe(false)
            expect(await materialize(rulify({ $not: delayed(0) }))).toBe(true)
        })

        it("returns false if everything is false", async () => {
            const resp = rulify({
                $and: [delayed(false), delayed(false), { $fn: () => delayed(false) }],
            })

            const result = await materialize(resp)

            expect(result).toBe(false)
        })
    })

    test("binary operators", async () => {
        expect(await materialize(rulify({ $lt: [5, 10] }))).toBe(true)
        expect(await materialize(rulify({ $lt: [15, 10] }))).toBe(false)

        expect(await materialize(rulify({ $lte: [9, 10] }))).toBe(true)
        expect(await materialize(rulify({ $lte: [10, 10] }))).toBe(true)
        expect(await materialize(rulify({ $lte: delayed([11, 10]) }))).toBe(false)

        expect(await materialize(rulify({ $gt: [5, delayed(10)] }))).toBe(false)
        expect(await materialize(rulify({ $gt: [5, 10] }))).toBe(false)
        expect(await materialize(rulify({ $gt: [15, 10] }))).toBe(true)

        expect(await materialize(rulify({ $gte: [9, 10] }))).toBe(false)
        expect(await materialize(rulify({ $gte: [10, { $fn: () => 10 }] }))).toBe(true)
        expect(await materialize(rulify({ $gte: [11, 10] }))).toBe(true)

        expect(await materialize(rulify({ $eq: [5, delayed(5)] }))).toBe(true)
        expect(await materialize(rulify({ $eq: [5, 10] }))).toBe(false)

        expect(await materialize(rulify({ $ne: [5, 5] }))).toBe(false)
        expect(await materialize(rulify({ $ne: [5, 10] }))).toBe(true)
    })

    test("eq objects", async () => {
        expect(await materialize(rulify({ $eq: [{ a: 1 }, { a: 1 }] }))).toBe(true)
        expect(await materialize(rulify({ $eq: [{ a: 1, b: 2 }, { a: 1 }] }))).toBe(false)
    })

    test("binary match", async () => {
        expect(
            await materialize(rulify(
                {
                    $handlers: {
                        async $capitalize(str) {
                            return (await materialize(str)).toUpperCase()
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
            ))
        ).toBe(true)

        expect(
            await materialize(rulify(
                {
                    $handlers: {
                        async $capitalize(str) {
                            return (await materialize(str)).toUpperCase()
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
            ))
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

            expect(await materialize(resp.value)).toBe(true)
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

            expect(await materialize(resp.value)).toBe(true)
        })

        it("returns false the current value is greater than the given value", async () => {
            const resp = rulify({
                age: 37,
                name: "Fred",
                value: {
                    $match: {
                        name: "Fred",
                        age: { $lt: 35 },
                    },
                },
            })

            expect(await materialize(resp.value)).toBe(false)
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

            expect(await materialize(resp.value)).toBe(true)
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

            expect(await materialize(resp.value)).toBe(false)
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

            expect(await materialize(resp.value)).toBe(true)
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

            expect(await materialize(resp.value)).toBe(false)
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

            expect(await materialize(resp.value)).toBe(true)
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

            expect(await materialize(resp.value)).toBe(false)
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

            expect(await materialize(resp.value)).toBe(true)
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

            expect(await materialize(resp.value)).toBe(false)
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

            expect(await materialize(resp.value)).toBe(true)
        })

        it("can not match arrays that are different", async () => {
            const resp = rulify({
                arr: [5, 10, 15],
                value: {
                    $match: {
                        arr: [5, 10, 12],
                    },
                },
            })

            expect(await materialize(resp.value)).toBe(false)
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

            expect(await materialize(resp.value)).toBe(true)
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

            expect(await materialize(resp.value)).toBe(false)
        })
    })
})
