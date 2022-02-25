import { evaluate } from ".."
import { sortNodes } from "./sortNodes"

export async function $and(obj) {
    const sorted = await sortNodes(obj)
    for await (const value of sorted) {
        if (!(await evaluate(value))) {
            return false
        }
    }
    return true
}

export async function $or(obj) {
    const sorted = await sortNodes(obj)
    for await (const value of sorted) {
        if (await evaluate(value)) {
            return true
        }
    }
    return false
}

export async function $not(obj) {
    return !(await evaluate(obj))
}
