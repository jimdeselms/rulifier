import { RAW_VALUE } from "./symbols"

export async function getRawValue(obj) {
    const value = await obj

    if (!value || typeof obj !== "object") {
        return value
    }

    return obj[RAW_VALUE] ?? obj
}
