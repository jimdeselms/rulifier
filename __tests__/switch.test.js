import { rulify, materialize } from "../src"
import { delayed } from "./helpers.test"

describe("switch", () => {
    it("returns the first case to match the condition", async () => {
        let resp = rulify({
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

        expect(await materialize(resp)).toEqual(1)

        resp = rulify({
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

        expect(await materialize(resp)).toEqual(2)
    })

    it("if no cases are present, it returns the default", async () => {
        let resp = rulify({
            $switch: {
                default: 3,
            },
        })

        expect(await materialize(resp)).toEqual(3)
    })

    it("if a case has no condition, it is false", async () => {
        let resp = rulify({
            $switch: {
                cases: [
                    {
                        value: 1,
                    },
                ],
                default: 2,
            },
        })

        expect(await materialize(resp)).toEqual(2)
    })

    it("if a case has no matching case or default, it is undefined", async () => {
        let resp = rulify({
            $switch: {
                cases: [
                    {
                        condition: false,
                        value: 1,
                    }
                ],
            },
        })

        expect(await materialize(resp)).toEqual(undefined)
    })

    it("can handle promises for conditions and values", async () => {
        let resp = rulify({
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

        expect(await materialize(resp)).toEqual(1)

        resp = rulify({
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

        expect(await materialize(resp)).toEqual(2)

        resp = rulify({
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

        expect(await materialize(resp)).toEqual(3)
    })
})
