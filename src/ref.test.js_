import { rulify } from "./index"
import { delayed } from "./helpers.test"

describe("ref", () => {
    it("can understand a simple ref", async () => {
        const resp = await rulify({
            thing: 123,
            value: { $ref: "thing" },
        })

        expect(await resp.value).toBe(123)
    })

    it("can understand a promise or function ref", async () => {
        const resp = await rulify({
            thing1: 1,
            thing2: { $fn: () => 2 },
            thing3: delayed(3),
            thing4: { $fn: () => delayed(4) },

            value1: { $ref: "thing1" },
            value2: { $ref: "thing2" },
            value3: { $ref: "thing3" },
            value4: { $ref: "thing4" },
        })

        expect(await resp.value1).toBe(1)
        expect(await resp.value2).toBe(2)
        expect(await resp.value3).toBe(3)
        expect(await resp.value4).toBe(4)
    })

    it("can understand a ref that has a path", async () => {
        const resp = await rulify({
            x: {
                y: {
                    z: "Hello",
                },
            },

            value: { $ref: "x.y.z" },
        })

        expect(await resp.value).toBe("Hello")
    })

    it("can understand a ref to an array using numeric paths", async () => {
        const resp = await rulify({
            x: [1, 2, [3, 4, 5, [6, 7]]],

            value: { $ref: "x.2.3.1" },
        })

        expect(await resp.value).toBe(7)
    })

    it("can understand a ref to an array using array index notation", async () => {
        const resp = await rulify({
            x: [1, 2, [3, 4, 5, [6, 7]]],

            value: { $ref: "x[2][3][1]" },
            value2: { $ref: "x[2][2]" },
        })

        expect(await resp.value).toBe(7)
        expect(await resp.value2).toBe(5)
    })

    it("returns undefined if the thing isn't found", async () => {
        const resp = await rulify({
            value: { $ref: "hello" },
        })

        expect(await resp.value).toBeUndefined()
    })

    it("returns undefined if any step in a path returns undefined", async () => {
        const resp = await rulify({
            hello: { a: 1 },
            value: { $ref: "hello.b.c" },
        })

        expect(await resp.value).toBeUndefined()
    })

    it("undefstands escaped dots and brackets in paths", async () => {
        const resp = await rulify({
            "hello.a": { "b.c": 1 },
            "howdy[0]": { "boo[1]": 5 },
            value1: { $ref: "hello\\.a.b\\.c" },
            value2: { $ref: "howdy\\[0].boo\\[1]" },
        })

        expect(await resp.value1).toBe(1)
        expect(await resp.value2).toBe(5)
    })
})
