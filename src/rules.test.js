const { buildResponse } = require("./index.js")

describe('and', () => {
    it('returns true if everything is true', async () => {
        const resp = buildResponse({
            $and: [ true, true ]
        })

        const result = await resp

        expect(result).toBe(true)
    })

    it('returns false if anything is false', async () => {
        const resp = buildResponse({
            $and: [ false, true ]
        })

        const result = await resp

        expect(result).toBe(false)
    })

})