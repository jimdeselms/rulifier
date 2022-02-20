import { proxify } from './rulify'

describe('proxify', () => {
    test('simple object', async () => {
        const p = prox(5)

        expect(await p.value()).toBe(5)
    })
})

function prox(obj) {
    const caches = {
        proxyCache: new WeakMap(),
        resolvedValueCache: new WeakMap(),
    }


    return proxify(obj, {}, undefined, undefined, caches)
}

