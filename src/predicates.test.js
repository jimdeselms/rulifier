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

    describe("match", () => {
        it("understands simple rules", async () => {
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
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
            const resp = buildResponse({
                age: 35,
                value: {
                    $match: {
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
                    $match: {
                        age: { $in: [30, 35, 40] }
                    }
                }
            })

            expect(await resp.value).toBe(false)
        })

        it("can match arrays", async () => {
            const resp = buildResponse({
                arr: [5, 10, 15],
                value: {
                    $match: {
                        arr: [5, 10, 15]
                    }
                }
            })

            expect(await resp.value).toBe(true)
        })

        it("can't match arrays that are different", async () => {
            const resp = buildResponse({
                arr: [5, 10, 12],
                value: {
                    $match: {
                        arr: [5, 10, 15]
                    }
                }
            })

            expect(await resp.value).toBe(false)
        })

        it("deep equality match true if objects match", async () => {
            const resp = buildResponse({
                thing: {
                    color: "Blue",
                    details: {
                        size: "Large",
                        dimensions: {
                            width: 10,
                            height: 20
                        }
                    }
                },
                value: {
                    $match: {
                        thing: {
                            color: "Blue",
                            details: {
                                size: "Large",
                                dimensions: {
                                    width: 10,
                                    height: { $lt: 21 }
                                }
                            }
                        }
                    }
                }
            })

            expect(await resp.value).toBe(true)
        })

        it("failed deep equality match if objects have differences", async () => {
            const resp = buildResponse({
                thing: {
                    color: "Blue",
                    details: {
                        size: "Large",
                        dimensions: {
                            width: 10,
                            height: 20
                        }
                    }
                },
                value: {
                    $match: {
                        thing: {
                            color: "Blue",
                            details: {
                                size: "Large",
                                dimensions: {
                                    width: 10,
                                    height: 21
                                }
                            }
                        }
                    }
                }
            })

            expect(await resp.value).toBe(false)
        })
    })
})
