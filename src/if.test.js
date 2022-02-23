import { rulify, evaluate } from "."

describe("if", () => {
    it("works in the true case", async () => {
        const resp = rulify({
            $if: {
                condition: true,
                then: 1,
                else: 2,
            },
        })

        expect(await evaluate(resp)).toBe(1)
    })

    it("works in the false case", async () => {
        const resp = rulify({
            $if: {
                condition: { $fn: () => false },
                then: 1,
                else: 2,
            },
        })

        expect(await evaluate(resp)).toBe(2)
    })
})
