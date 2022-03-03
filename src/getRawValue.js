const { RAW_VALUE } = require("./symbols")

module.exports.getRawValue = async function getRawValue(obj) {
    const value = await obj

    if (!value || typeof obj !== "object") {
        return value
    }

    return obj[RAW_VALUE] ?? obj
}
