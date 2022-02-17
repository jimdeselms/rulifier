import { COST } from '../common'

export function* sortNodes(nodes) {

    if (!nodes) { return }
    
    let proxies = []
    for (const proxy of nodes) {
        proxies.push(proxy)
    }

    while (proxies.length > 0) {
        proxies.sort((n1, n2) => calcCost(n1) - calcCost(n2))
        yield proxies[0]
        proxies = proxies.slice(1)
    }
}

function calcCost(node) {
    const type = typeof node
    // A simple object is essentially free to evaluate.
    if (node === null || (type !== "object" && type !== "function")) {
        return 0
    }

    return node[COST]
}