const { rulify } = require("../dist/index.cjs.js")

describe("if", () => {
    it("works in the true case", async () => {
        const resp = rulify({
            $if: {
                condition: true,
                then: 1,
                else: 2,
            },
        })

        const result = await resp

        expect(result).toBe(1)
    })

    it("works in the false case", async () => {
        const resp = rulify({
            $if: {
                condition: () => false,
                then: 1,
                else: 2,
            },
        })

        const result = await resp

        expect(result).toBe(2)
    })
})
