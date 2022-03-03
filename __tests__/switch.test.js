const { Rulifier } = require("../src")
const { delayed } = require("./helpers.test")

describe("switch", () => {
    it("returns the first case to match the condition", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        condition: true,
                        value: 1,
                    },
                    {
                        condition: true,
                        value: 2,
                    },
                ],
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(1)

        resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        condition: false,
                        value: 1,
                    },
                    {
                        condition: true,
                        value: 2,
                    },
                ],
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(2)
    })

    it("if no cases are present, it returns the default", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: {
                default: 3,
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(3)
    })

    it("if a case has no condition, it is false", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        value: 1,
                    },
                ],
                default: 2,
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(2)
    })

    it("if a case has no matching case or default, it is undefined", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        condition: false,
                        value: 1,
                    }
                ],
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(undefined)
    })

    it("can handle promises for conditions and values", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        condition: delayed(true),
                        value: delayed(1),
                    },
                    {
                        condition: delayed(true),
                        value: delayed(2),
                    },
                ],
                default: delayed(3),
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(1)

        resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        condition: delayed(false),
                        value: delayed(1),
                    },
                    {
                        condition: delayed(true),
                        value: delayed(2),
                    },
                ],
                default: delayed(3),
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(2)

        resp = rulifier.applyContext({
            $switch: {
                cases: [
                    {
                        condition: delayed(false),
                        value: delayed(1),
                    },
                    {
                        condition: delayed(false),
                        value: delayed(2),
                    },
                ],
                default: delayed(3),
            },
        })

        expect(await rulifier.materialize(resp)).toEqual(3)
    })
})
