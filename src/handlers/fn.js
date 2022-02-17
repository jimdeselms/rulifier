import { RAW_VALUE } from '../common'

export async function $fn(obj, opt) {
    const fn = obj[RAW_VALUE]
    return fn()
}

function ifCost(proxy) {

}