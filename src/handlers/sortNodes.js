import { COST, CALCULATE_COST } from '../common'

export function* sortNodes(nodes) {

    if (!nodes) { return }

    const nodesCopy = nodes.slice(0)
    while (nodesCopy.length > 0) {
        nodesCopy.sort((n1, n2) => calcCost(n1) - calcCost(n2))
        yield nodesCopy[0]
        delete nodesCopy[0]
    }
}

const DEFAULT_FUNCTION_COST = 10
const DEFAULT_NODE_COST = 1

function calcCost(node) {
    const type = typeof node
    // A simple object is essentially free to evaluate.
    if (node === null || (type !== "object" && type !== "function")) {
        return 0
    }

    // If it's a function, then it MAY have a cost associated with it
    if (type === "function") {
        return node[COST] ?? DEFAULT_FUNCTION_COST
    }

    return node[CALCULATE_COST]?.() ?? DEFAULT_NODE_COST
}