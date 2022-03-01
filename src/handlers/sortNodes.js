import { calculateCost } from "../calculateCost"
import { getLength } from ".."
import { ITERATE_RAW } from "../symbols"

export async function sortNodes(nodes, ctx) {
    const rawNodes = await nodes[ITERATE_RAW]()

    if (rawNodes.length >= 2) {

        const nodeCostPairs = rawNodes.map((n, i) => [nodes[i], calculateCost(n, ctx)])
        
        debugger

        nodeCostPairs.sort((p1, p2) => (p1[1] - p2[1]))

        return nodeCostPairs.map(([value]) => value)
    } else {
        return rawNodes.map((_, i) => nodes[i])
    }
}
