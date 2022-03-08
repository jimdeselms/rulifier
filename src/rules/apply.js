import { applyNewContext } from "../methods"

export async function $apply(obj) {
    return await applyNewContext(obj.expr, obj.context)
}
