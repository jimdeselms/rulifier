import { RAW_VALUE } from '../common'

export async function $fn(obj, opt) {
    const value = obj()
    return value
}

function ifCost(proxy) {

}