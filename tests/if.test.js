import { Rulifier } from "../src"

describe("if", () => {
    it("works in the true case", async () => {
        const rulifier = new Rulifier({
            $if: {
                condition: true,
                then: 1,
                else: 2,
            }
        })

        const resp = rulifier.applyContext()

        expect(await rulifier.materialize(resp)).toBe(1)
    })

    it("works in the false case", async () => {

        const rulifier = new Rulifier([
            {
                $if: {
                    condition: { $fn: () => false },
                    then: 1,
                    else: 2,
                },
            }
        ])

        const resp = rulifier.applyContext()

        expect(await rulifier.materialize(resp)).toBe(2)
    })
})
