import { RAW_VALUE } from "../common"

export async function $fn(obj) {
    const value = (await obj[RAW_VALUE])()
    return value
}

function ifCost(proxy) {}
