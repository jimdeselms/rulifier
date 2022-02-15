export async function $and(obj) {
    for (const value of obj) {
        if (!(await value)) {
            return false
        }
    }
    return true
}

export async function $or(obj) {
    for (const value of obj) {
        if (await value) {
            return true
        }
    }
    return false
}

export async function $not(obj) {
    return !(await obj)
}
