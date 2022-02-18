import { sortNodes } from "./sortNodes"

export async function $and(obj) {
    for (const value of obj) {
//    for await (const value of sortNodes(await obj)) {
        if (!(await value)) {
            return false
        }
    }
    return true
}

export async function $or(obj) {
//    for await (const value of sortNodes(await obj)) {
    for (const value of await obj) {
        if (await value) {
            return true
        }
    }
    return false
}

export async function $not(obj) {
    return !(await obj)
}
