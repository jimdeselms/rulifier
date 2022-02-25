import { evaluate, getKeys } from ".."

export async function $ref(obj, { root }) {
    const path = parsePath(await evaluate(obj))

    let curr = root
    for (const key of path) {
        curr = curr[key]
    }

    return await evaluate(curr)
}

const ARRAY_INDEX_REGEX = /\[([0-9])+\]/g
const ESCAPED_DOT_REPLACEMENT_REGEX = /\\\./g
const ESCAPED_BRACKET_REPLACEMENT_REGEX = /\\\[/g

function parsePath(path) {
    path = path.replace(ESCAPED_DOT_REPLACEMENT_REGEX, "((<{dot}))>>")
    path = path.replace(ESCAPED_BRACKET_REPLACEMENT_REGEX, "((<{brk}))>>")

    const indexes = path.matchAll(ARRAY_INDEX_REGEX)

    for (const index of indexes) {
        path = path.replace(index[0], "." + index[1])
    }

    const parts = path
        .split(".")
        .map((p) => p.replace(/\(\(\<\{dot\}\)\)\>\>/g, "."))
        .map((p) => p.replace(/\(\(\<\{brk\}\)\)\>\>/g, "["))

    return parts
}
