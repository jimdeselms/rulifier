const { calculateCost } = require("./calculateCost")
const { ITERATE_RAW, RAW_VALUE, PROXY_CONTEXT } = require("./symbols")

module.exports.sortNodes = async function sortNodes(nodes, ctx, accessor = (x) => x) {
    const rawNodes = await nodes[ITERATE_RAW]()

    if (rawNodes.length >= 2) {
        const nodeCostPairs = rawNodes.map((n, i) => [nodes[i], calculateCost(accessor(n), ctx)])

        nodeCostPairs.sort((p1, p2) => p1[1] - p2[1])

        return nodeCostPairs.map(([value]) => value)
    } else {
        return rawNodes.map((_, i) => nodes[i])
    }
}

module.exports.sortKeysForComparison = async function sortKeysForComparison(keys, obj1, obj2) {
    const ctx = obj1[PROXY_CONTEXT]

    if (keys.length >= 2) {
        const nodeCostPairs = []
        for (const key of keys) {
            const node1 = await obj1[RAW_VALUE]
            const node2 = await obj2[RAW_VALUE]

            nodeCostPairs.push([key, calculateCost(node1[key], ctx) + calculateCost(node2[key], ctx)])
        }

        nodeCostPairs.sort((p1, p2) => p1[1] - p2[1])
        return nodeCostPairs.map(([value]) => value)
    } else {
        return keys
    }
}
