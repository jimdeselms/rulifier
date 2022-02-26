import { COST, RAW_VALUE, PROXY_CONTEXT } from "../common"

export async function* sortNodes(nodes) {
    if (!nodes) {
        return
    }

    const nodeValuePairs = []
    for await (const node of nodes) {
        nodeValuePairs.push([node, await node[RAW_VALUE]])
    }

    while (nodeValuePairs.length > 0) {
        nodeValuePairs.sort(calcCost)
        yield nodeValuePairs[0][0]
        nodeValuePairs.splice(0, 1)
    }
}

function calcCost(nodeValuePair) {
    const context = nodeValuePair[0][PROXY_CONTEXT]
    debugger

    const value = nodeValuePair[1]
    const type = typeof value
    // A simple object is essentially free to evaluate.
    if (value === null || (type !== "object" && type !== "function")) {
        return 0
    } else {
        return 1
    }
}
