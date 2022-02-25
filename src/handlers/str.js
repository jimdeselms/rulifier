const STR_INTERP_REGEX = /\\?\${([^}]+)}*/g

import { evaluate } from ".."
import { $ref } from "./ref"

export async function $str(obj, { root, proxify }) {
    let result = await evaluate(obj)

    for (const match of result.matchAll(STR_INTERP_REGEX)) {
        const matchText = match[0]

        // You can escape it with "\"
        if (matchText[0] === "\\") {
            result = result.replace(matchText, matchText.slice(1))
        } else {
            const replacement = await $ref(proxify(match[1]), { root })
            if (replacement === null) {
                result = result.replace(matchText, "")
            } else if (replacement !== undefined) {
                result = result.replace(match[0], replacement)
            }
        }
    }

    return await result
}
