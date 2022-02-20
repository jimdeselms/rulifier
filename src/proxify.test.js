import { proxify } from './rulify'

describe('proxify', () => {
    test('simple object', async () => {
        const p = prox(5)

        expect(await p.value()).toBe(5)
    })

    test('string', async () => {
        const p = prox("Hello")

        expect(await p.value()).toBe("Hello")
    })

    test('promise that returns string', async () => {
        const p = prox(Promise.resolve("Hello"))

        expect(await p.value()).toBe("Hello")
    })

    test('simple object with a key', async () => {
        const p = prox({ a: 500 })

        expect(await p.a.value()).toBe(500)
    })

    test('simple object with a chain of keys', async () => {
        const p = prox({ a: {b: {c: {d: 12345 }}}})

        expect(await p.a.b.c.d.value()).toBe(12345)
    })

    test('simple array', async () => {
        const p = prox([1, 2, 3])

        expect(await p[1].value()).toBe(2)
    })

    test('getting value that resovles to an object with a key', async () => {
        const p = prox({a: {b: {c: 1}}})

        expect(await p.a.b.value()).toMatchObject({ c: 1 })
    })

    test('getting value that resovles to an array', async () => {
        const p = prox({a: {b: [5, 10, 15]}})

        expect(await p.a.b.value()).toMatchObject([5, 10, 15])
    })
})

function prox(obj) {
    const caches = {
        proxyCache: new WeakMap(),
        resolvedValueCache: new WeakMap(),
    }


    return proxify(obj, {}, undefined, undefined, caches)
}

