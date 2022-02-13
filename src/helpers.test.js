const { TestWatcher } = require("jest")

async function delayed(response) {
    await new Promise((r) => setTimeout(r, 1))
    return response
}

describe("testHelpers", () => {
    test("delayed", async () => {
        await delayed()
    })
})

module.exports = {
    delayed,
}
