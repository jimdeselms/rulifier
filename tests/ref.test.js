import { Rulifier } from "../src"
import { delayed } from "./helpers.test"

describe("ref", () => {
    it("can understand a simple ref", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            thing: 123,
            value: { $ref: "thing" }
        })

        expect(await rulifier.materialize(resp.value)).toBe(123)
    })

    it("can understand a promise or function ref", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            thing1: 1,
            thing2: { $fn: () => 2 },
            thing3: delayed(3),
            thing4: { $fn: () => delayed(4) },

            value1: { $ref: "thing1" },
            value2: { $ref: "thing2" },
            value3: { $ref: "thing3" },
            value4: { $ref: "thing4" },
        })

        expect(await rulifier.materialize(resp.value1)).toBe(1)
        expect(await rulifier.materialize(resp.value2)).toBe(2)
        expect(await rulifier.materialize(resp.value3)).toBe(3)
        expect(await rulifier.materialize(resp.value4)).toBe(4)
    })

    it("can understand a ref that has a path", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            x: {
                y: {
                    z: "Hello",
                },
            },

            value: { $ref: "x.y.z" },
        })

        expect(await rulifier.materialize(resp.value)).toBe("Hello")
    })

    it("can understand a ref to an array using numeric paths", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            x: [1, 2, [3, 4, 5, [6, 7]]],

            value: { $ref: "x.2.3.1" },
        })

        expect(await rulifier.materialize(resp.value)).toBe(7)
    })

    it("can understand a ref to an array using array index notation", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            x: [1, 2, [3, 4, 5, [6, 7]]],

            value: { $ref: "x[2][3][1]" },
            value2: { $ref: "x[2][2]" },
        })

        expect(await rulifier.materialize(resp.value)).toBe(7)
        expect(await rulifier.materialize(resp.value2)).toBe(5)
    })

    it("returns undefined if the thing isn't found", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            value: { $ref: "hello" },
        })

        expect(await rulifier.materialize(resp.value)).toBeUndefined()
    })

    it("undefstands escaped dots and brackets in paths", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            "hello.a": { "b.c": 1 },
            "howdy[0]": { "boo[1]": 5 },
            value1: { $ref: "hello\\.a.b\\.c" },
            value2: { $ref: "howdy\\[0].boo\\[1]" },
        })

        expect(await rulifier.materialize(resp.value1)).toBe(1)
        expect(await rulifier.materialize(resp.value2)).toBe(5)
    })

    it("returns undefined if looking up a non-existent property on value that does exist.", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            a: {
                b: {
                    c: 1
                }
            }
        })

        expect(await rulifier.materialize(resp.a.b.UNDEFINED)).toBe(undefined)
    })

    it("throws an error when referencing a property on an undefined value.", async () => {
        const rulifier = new Rulifier()
        const resp = await rulifier.applyContext({
            a: {}
        })

        await expect(() => rulifier.materialize(resp.a.b.UNDEFINED)).rejects.toThrow()
    })
})
