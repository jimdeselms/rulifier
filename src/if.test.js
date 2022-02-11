const { buildResponse } = require("./index.js")

describe('if', () => {
    it('works in the true case', async () => {
        const resp = buildResponse({
            $if: {
                condition: true,
                ifTrue: 1,
                ifFalse: 2
            }
        })

        const result = await resp

        expect(result).toBe(1)
    })

    it('works in the false case', async () => {
        const resp = buildResponse({
            $if: {
                condition: false,
                ifTrue: 1,
                ifFalse: 2
            }
        })

        const result = await resp

        expect(result).toBe(2)
    })
})