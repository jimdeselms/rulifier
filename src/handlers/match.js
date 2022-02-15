import { eq } from './eq'

export async function $match(obj, { root }) {
    obj = await obj
    if (Array.isArray(obj)) {
        return eq(obj[0], obj[1], true, false)
    } else {
        return eq(obj, root, true, true)
    }
}
