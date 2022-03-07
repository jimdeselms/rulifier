import { Rulifier } from "../src"
import { delayed } from "./helpers.test"

describe("rulify", () => {
    it("knows about handlers", async () => {
        const rulifier = new Rulifier({
            handlers: {
                capitalize: async (name) => (await rulifier.materialize(name)).toUpperCase(),
            }
        })

        const resp = rulifier.applyContext({
            name: {
                $capitalize: "Fred",
            },
        })

        expect(await rulifier.materialize(resp.name)).toBe("FRED")
    })

    it("throws an error if a cycle in a handler", async () => {
        const hasCycle = {}
        hasCycle.$or = [hasCycle]

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext(hasCycle)

        await expect(() => rulifier.materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })

    it("When materializing the same expression, the handler is only evaluated once.", async () => {
        let calls = 0

        const r = new Rulifier({
            dataSources: [
                {
                    value: {
                        $log: {
                            a: {
                                b: 1
                            }
                        }
                    }
                }
            ],
            handlers: {
                $log(value) {
                    calls++
                    return value
                }
            }
        })

        const foo = r.applyContext()

        await r.materialize(foo)
        await r.materialize(foo.a)
        await r.materialize(foo.a.b)

        expect(calls).toBe(1)
    })

    it("a handler can return a value that calls a handler", async () => {
        const r = new Rulifier({
            dataSources: [
                {
                    val: {
                        $greetToUpper: {
                            greeting: "Howdy",
                            name: "World"
                        }
                    }
                }
            ],
            handlers: {
                async $toUpper(val, sdk) {
                    const str = await sdk.materialize(val)
                    return str.toUpperCase()
                },
                async $greetToUpper(val, sdk) {
                    val = await sdk.materialize(val)

                    return {
                        $toUpper: { $str: `${val.greeting}, ${val.name}!` }
                    }
                }
            }
        })

        const resp = r.applyContext()
        expect(await r.materialize(resp.val)).toBe("HOWDY, WORLD!")
    })

    it("can have two references to same thing without causing a cycle", async () => {
        const r = new Rulifier({
            dataSources: [
                {
                    foo: [ { $ref: delayed("a") }, { $ref: delayed("a") } ],
                    a: { $toLower: "HELLO" }
                }
            ],
            handlers: {
                async $toLower(a, b) {
                    return (await b.materialize(a)).toLowerCase()
                }
            }
        })

        const a = r.applyContext()
        expect(await r.materialize(a.foo)).toMatchObject(["hello", "hello"])
    })

    it("can add context within a proxy", async () => {
        const r = new Rulifier({
            dataSources: [
                {
                    value: { $greeting: "Hello" },
                }
            ],
            handlers: {
                async $greeting(obj, sdk) {
                    const greeting = await sdk.materialize(obj)

                    return {
                        $apply: {
                            expr: { $str: "${greeting}, ${name}"},
                            context: { 
                                greeting,
                                name: "Fred" 
                            }
                        }
                    }
                }
            }
        })

        const a = r.applyContext()

        expect(await r.materialize(a.value)).toBe("Hello, Fred")
    })
})
