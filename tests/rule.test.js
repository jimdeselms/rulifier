import { Rulifier } from "../src"
import { delayed } from "./helpers.test"

describe("rulify", () => {
    it("knows about rules", async () => {
        const rulifier = new Rulifier({}, {
            rules: {
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

    it("throws an error if a cycle in a rule", async () => {
        const hasCycle = {}
        hasCycle.$or = [hasCycle]

        const rulifier = new Rulifier()
        const resp = rulifier.applyContext(hasCycle)

        await expect(() => rulifier.materialize(resp.hasCycle.hasCycle)).rejects.toThrow()
    })

    it("When materializing the same expression, the rule is only evaluated once.", async () => {
        let calls = 0

        const r = new Rulifier(
            {
                value: {
                    $log: {
                        a: {
                            b: 1
                        }
                    }
                }
            },
            {
                rules: {
                    $log(value) {
                        calls++
                        return value
                    }
                }
            }
        )

        const foo = r.applyContext()

        await r.materialize(foo)
        await r.materialize(foo.a)
        await r.materialize(foo.a.b)

        expect(calls).toBe(1)
    })

    it("a rule can return a value that calls a rule", async () => {
        const r = new Rulifier(
            [
                {
                    val: {
                        $greetToUpper: {
                            greeting: "Howdy",
                            name: "World"
                        }
                    }
                }
            ],
            {
                rules: {
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
            }
        )

        const resp = r.applyContext()
        expect(await r.materialize(resp.val)).toBe("HOWDY, WORLD!")
    })

    it("can have two references to same thing without causing a cycle", async () => {
        const r = new Rulifier({
                foo: [ { $ref: delayed("a") }, { $ref: delayed("a") } ],
                a: { $toLower: "HELLO" }
        },
        {
            rules: {
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
            value: { $greeting: "Hello" },
        },
        {
            rules: {
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
