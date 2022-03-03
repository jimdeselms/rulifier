const { rulify, materialize } = require("../src")

describe("if", () => {
    it("works in the true case", async () => {
        const resp = rulify({
            $if: {
                condition: true,
                then: 1,
                else: 2,
            },
        })

        expect(await materialize(resp)).toBe(1)
    })

    it("works in the false case", async () => {
        const resp = rulify({
            $if: {
                condition: { $fn: () => false },
                then: 1,
                else: 2,
            },
        })

        expect(await materialize(resp)).toBe(2)
    })
})
