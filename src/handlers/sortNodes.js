import { RAW_VALUE, PROXY_CONTEXT } from "../symbols"
import { calculateCost } from "../calculateCost"

export async function* sortNodes(nodes, ctx) {
    if (!nodes) {
        return
    }

    // TODO - don't sort if there's only one item.

    const nodeCostPairs = []
    for await (const node of nodes) {
        nodeCostPairs.push([node, await calculateCost(node, ctx)])
    }

    while (nodeCostPairs.length > 0) {
        nodeCostPairs.sort(compareCost)
        yield nodeCostPairs[0][0]
        nodeCostPairs.splice(0, 1)
    }
}

function compareCost(nodeCostPair1, nodeCostPair2) {
    return nodeCostPair1[1] - nodeCostPair2[1]
}
