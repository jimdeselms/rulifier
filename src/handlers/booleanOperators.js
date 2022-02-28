import { sortNodes } from "./sortNodes"

export async function $and(obj, api) {
    const sorted = await sortNodes(obj)
    for await (const value of sorted) {
        if (!(await api.realize(value))) {
            return false
        }
    }
    return true
}

export async function $or(obj, api) {
    const sorted = await sortNodes(obj)
    for await (const value of sorted) {
        if (await api.realize(value)) {
            return true
        }
    }
    return false
}

export async function $not(obj, api) {
    return !(await api.realize(obj))
}
