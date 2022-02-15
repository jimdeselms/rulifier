export async function $if(obj) {
    const condition = await obj.condition
    return condition ? obj.then : obj.else
}
