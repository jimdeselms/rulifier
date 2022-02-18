import { RAW_VALUE } from '../common'

export async function $fn(obj, opt) {
    return await obj()
}

function ifCost(proxy) {

}