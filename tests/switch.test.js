import { Rulifier } from "../src"
import { delayed } from "./helpers.test"

describe("switch", () => {
    it("returns the first case to match the condition", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: [
                {
                    condition: true,
                    value: 1,
                },
                {
                    condition: true,
                    value: 2,
                },
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(1)

        resp = rulifier.applyContext({
            $switch: [
                {
                    condition: false,
                    value: 1,
                },
                {
                    condition: true,
                    value: 2,
                },
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(2)
    })

    it("if no cases are present, it returns the default", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: [
                {
                    value: 3
                }
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(3)
    })

    it("if a case has no condition, it is considered to be the default", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: [
                {
                    condition: false,
                    value: 1,
                },
                {
                    value: 2
                }
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(2)
    })

    it("if a case has no matching case or default, it is undefined", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: [
                {
                    condition: false,
                    value: 1,
                }
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(undefined)
    })

    it("can handle promises for conditions and values", async () => {
        const rulifier = new Rulifier()
        let resp = rulifier.applyContext({
            $switch: [
                {
                    condition: delayed(true),
                    value: delayed(1),
                },
                {
                    condition: delayed(true),
                    value: delayed(2),
                },
                {
                    value: delayed(3)
                }
            ]
        })

        expect(await rulifier.materialize(resp)).toEqual(1)

        resp = rulifier.applyContext({
            $switch: [
                {
                    condition: delayed(false),
                    value: delayed(1),
                },
                {
                    condition: delayed(true),
                    value: delayed(2),
                },
                { 
                    value: delayed(3)
                }
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(2)

        resp = rulifier.applyContext({
            $switch: [
                {
                    condition: delayed(false),
                    value: delayed(1),
                },
                {
                    condition: delayed(false),
                    value: delayed(2),
                },
                { 
                    value: delayed(3)
                }
            ],
        })

        expect(await rulifier.materialize(resp)).toEqual(3)
    })
})
