import { Rulifier } from "../src"
import { delayed } from "./helpers.test"

describe("predicates", () => {
    describe("$and", () => {
        it("returns true if everything is true", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $and: [{ $fn: () => true }, { $fn: () => delayed(true) }, true],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(true)
        })

        it("returns false if anything is false", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $and: [{ $fn: () => delayed(false) }, { $fn: () => true }, true],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(false)
        })

        it("can handle nested ands", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $and: [
                    { 
                        $fn: () => ({ $and: [true, { $fn: () => true }] })
                    },
                    {
                        $and: [true, true]
                    }
                ]
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(true)
        })

        it("returns true if there are no options", async () => {
            // And is if every one of its options is true. If there are no options,
            // then it is true. (This is the same behavior as Scheme.)
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $and: [],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(true)
        })
    })

    describe("$or", () => {
        it("returns true if one thing is true", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $or: [delayed(false), delayed(false), { $fn: () => delayed(true) }],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(true)
        })

        it("returns false if everything is false", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $or: [delayed(false), delayed(false), { $fn: () => delayed(false) }],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(false)
        })

        it("returns false if there are no options", async () => {
            // Or is true if any of its options are false, so, if there are no options,
            // it is false. (This is the same behavior as Scheme.)
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $or: [],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(false)
        })
    })

    describe("$not", () => {
        it("negates the value", async () => {
            const rulifier = new Rulifier()
            expect(await rulifier.materialize(rulifier.applyContext({ $not: true }))).toBe(false)
            expect(await rulifier.materialize(rulifier.applyContext({ $not: false }))).toBe(true)
            expect(await rulifier.materialize(rulifier.applyContext({ $not: delayed(1) }))).toBe(false)
            expect(await rulifier.materialize(rulifier.applyContext({ $not: delayed(0) }))).toBe(true)
        })

        it("returns false if everything is false", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                $and: [delayed(false), delayed(false), { $fn: () => delayed(false) }],
            })

            const result = await rulifier.materialize(resp)

            expect(result).toBe(false)
        })
    })

    test("binary operators", async () => {
        const rulifier = new Rulifier()

        expect(await rulifier.materialize(rulifier.applyContext({ $lt: [5, 10] }))).toBe(true)
        expect(await rulifier.materialize(rulifier.applyContext({ $lt: [15, 10] }))).toBe(false)

        expect(await rulifier.materialize(rulifier.applyContext({ $lte: [9, 10] }))).toBe(true)
        expect(await rulifier.materialize(rulifier.applyContext({ $lte: [10, 10] }))).toBe(true)
        expect(await rulifier.materialize(rulifier.applyContext({ $lte: delayed([11, 10]) }))).toBe(false)

        expect(await rulifier.materialize(rulifier.applyContext({ $gt: [5, delayed(10)] }))).toBe(false)
        expect(await rulifier.materialize(rulifier.applyContext({ $gt: [5, 10] }))).toBe(false)
        expect(await rulifier.materialize(rulifier.applyContext({ $gt: [15, 10] }))).toBe(true)

        expect(await rulifier.materialize(rulifier.applyContext({ $gte: [9, 10] }))).toBe(false)
        expect(await rulifier.materialize(rulifier.applyContext({ $gte: [10, { $fn: () => 10 }] }))).toBe(true)
        expect(await rulifier.materialize(rulifier.applyContext({ $gte: [11, 10] }))).toBe(true)

        expect(await rulifier.materialize(rulifier.applyContext({ $eq: [5, delayed(5)] }))).toBe(true)
        expect(await rulifier.materialize(rulifier.applyContext({ $eq: [5, 10] }))).toBe(false)

        expect(await rulifier.materialize(rulifier.applyContext({ $ne: [5, 5] }))).toBe(false)
        expect(await rulifier.materialize(rulifier.applyContext({ $ne: [5, 10] }))).toBe(true)
    })

    test("eq objects", async () => {
        const rulifier = new Rulifier()
        expect(await rulifier.materialize(rulifier.applyContext({ $eq: [{ a: 1 }, { a: 1 }] }))).toBe(true)
        expect(await rulifier.materialize(rulifier.applyContext({ $eq: [{ a: 1, b: 2 }, { a: 1 }] }))).toBe(false)
    })

    test("binary match", async () => {
        const rulifier = new Rulifier({}, {
            rules: {
                async $capitalize(str, api) {
                    return (await api.materialize(str)).toUpperCase()
                }
            }
        })

        expect(
            await rulifier.materialize(rulifier.applyContext(
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
            await rulifier.materialize(rulifier.applyContext(
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
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "Jim",
                age: 29,
                value: {
                    $match: {
                        name: "Jim",
                        age: 29,
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("returns true the current value is less than the given value", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                age: 32,
                name: "Fred",
                value: {
                    $match: {
                        name: "Fred",
                        age: { $lt: 35 },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("returns false the current value is greater than the given value", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                age: 37,
                name: "Fred",
                value: {
                    $match: {
                        name: "Fred",
                        age: { $lt: 35 },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })

        it("returns true if the current value matches the regex", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "FRED",
                value: {
                    $match: {
                        name: /ed/i,
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("returns false if the current value matches the regex", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "Bill",
                value: {
                    $match: {
                        name: /ed/,
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })

        it("returns true if the current value matches a regex string", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "Fred",
                value: {
                    $match: {
                        name: { $regex: "ed" },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("returns false if the current value does not match a regex string", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "Bill",
                value: {
                    $match: {
                        name: { $regex: "ed" },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })

        it("returns true if the current value matches a regex with parameters", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "Fred",
                value: {
                    $match: {
                        name: { $regex: { pattern: "ED", flags: "i" } },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("returns false if the current value does not match a regex with parameters", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                name: "Bill",
                value: {
                    $match: {
                        name: { $regex: { pattern: "ed", flags: "i" } },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })

        it("true if in", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                age: 35,
                value: {
                    $match: {
                        age: { $in: [30, 35, 40] },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("false if not in", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                age: 34,
                value: {
                    $match: {
                        age: { $in: [30, 35, 40] },
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })

        it("true if not in, using $not", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                age: 34,
                value: {
                    $match: {
                        age: { $not: { $in: [30, 35, 40] }},
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("can match arrays", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                arr: [5, 10, 15],
                value: {
                    $match: {
                        arr: [5, 10, 15],
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("can not match arrays that are different", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
                arr: [5, 10, 15],
                value: {
                    $match: {
                        arr: [5, 10, 12],
                    },
                },
            })

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })

        it("deep equality match true if objects match", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
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

            expect(await rulifier.materialize(resp.value)).toBe(true)
        })

        it("failed deep equality match if objects have differences", async () => {
            const rulifier = new Rulifier()
            const resp = rulifier.applyContext({
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

            expect(await rulifier.materialize(resp.value)).toBe(false)
        })
    })
})
