export async function $if(obj) {
    const condition = await obj.condition.value()
    return condition ? await obj.then.value() : await obj.else.value()
}
