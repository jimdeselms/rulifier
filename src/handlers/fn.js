import { RAW_VALUE } from "../symbols"

export async function $fn(obj) {
    const value = (await obj[RAW_VALUE])()
    return value
}

function ifCost(proxy) {}
