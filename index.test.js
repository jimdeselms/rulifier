const { evaluateRule, selectValue, readValueFromService } = require('.')

describe("siteflow example", () => {
    it("can replace a simple siteflow request", async () => {
        // This is an example Siteflow rule. This replaces the rule
        /*
            {
                "slug": "ProductPage",
                "type": "Discovery",
                "url": {
                    "services": [
                    {
                        "templatizedServiceUrl": "https://url.prod.merch.vpsvc.com/v3/all/vistaprint/{culture}?pageType=Product&requestor=siteflow",
                        "extractResponseFieldsAs": [
                        {
                            "jpathQuery": "{mpv}.url",
                            "fieldAs": "productPageUrl"
                        }
                        ],
                        "errorHandling": { "allowedErrorCodes": [ 404 ] }
                    }
                    ],
                    "templatizedUrl": "{productPageUrl}"
                },
                "eligibility": {
                    "rules": [
                    {
                        "ruleType": "ServiceBased",
                        "templatizedServiceUrl": "https://page-availability-service.prod.merch.vpsvc.com/api/v2/vistaprint/productpage/public/{culture}?requestor=siteflow",
                        "responseShape": {
                        "jpathQuery": "$[?(@.urlId == '{mpv}')].availability.available",
                        "expectedValue": true
                        }
                    }
                    ]
                },
                "domain": "vistaprint"
            }
        */
       
        const options = [
            { 
                rule: { 
                    available: true 
                },
                value: {
                    slug: "ProductPage",
                    type: "Discovery",
                    url: "{productPageUrl}"
                }
            }
        ]

        const ctx = { 
            culture: "en-IE",
            mpv: "standardBusinessCards"
        }

        const contextProviders = {
            available: async (ctx, ctxProviders) => readValueFromService(ctx, ctxProviders, {
                url: "https://page-availability-service.prod.merch.vpsvc.com/api/v2/vistaprint/productpage/public/{culture}?requestor=siteflow",
                jpathQuery: "$[?(@.urlId == '{mpv}')].availability.available"
            }),

            productPageUrl: async (ctx, ctxProviders) => readValueFromService(ctx, ctxProviders, {
                url: "https://url.prod.merch.vpsvc.com/v3/all/vistaprint/{culture}?pageType=Product&requestor=siteflow",
                jpathQuery: "{mpv}.url"
            })
        }

        const result = await selectValue(options, ctx, contextProviders)

        expect(result).toMatchObject({
            slue: "ProductPage",
            type: "Discovery",
            url: "/business-cards/standard"
        })
    })
})

describe("evaluateRule", () => {
    it("is true if the item is in the context", async () => {
        expect(await evaluateRule({ a: 1 }, { a: 1 })).toBe(true)
    })

    it("is false if the item is not in the context", async () => {
        expect(await evaluateRule({ a: 1 }, {})).toBe(false)
    })

    it("is false if the item does not match the context", async () => {
        expect(await evaluateRule({ a: 1 }, { a: 2 })).toBe(false)
    })

    it("is true if nothing is required", async () => {
        expect(await evaluateRule({}, { a: 1 })).toBe(true)
    })

    it("is true if the rule specifies an array of allowed values, and one of the values is in the context", async () => {
        const context = {
            a: 2
        }

        const rule = {
            a: [1, 2]
        }

        expect(await evaluateRule(rule, context)).toBe(true)
    })

    it("is false if the rule specifies an array of allowed values, but none of them match the context", async () => {
        const context = {
            a: 3
        }

        const rule = {
            a: [1, 2]
        }

        expect(await evaluateRule(rule, context)).toBe(false)
    })

    it("can calculate a value from a context provider", async () => {
        const context = {
            name: "fred"
        }

        const providers = {
            capitalizedName: (ctx) => ctx.name.toUpperCase()
        }

        expect(await evaluateRule({ capitalizedName: "FRED" }, context, providers))
    })

    it("can evaluate an array of rules as an 'or'", async () => {
        const rule = [
            { a: 1 },
            { a: 2 }
        ]

        const ctx = {
            a: 2
        }

        expect(await evaluateRule(rule, ctx)).toBe(true)
    })

    it("returns false if no part of an 'or' rule matches", async () => {
        const rule = [
            { a: 1 },
            { a: 2 }
        ]

        const ctx = {
            a: 3
        }

        expect(await evaluateRule(rule, ctx)).toBe(false)
    })

    it("runs slow rules last", async () => {
        let slowProviderWasCalled = false

        const rule = [
            { slowName: "Fred" },
            { fastName: "Dave" }
        ]

        const ctx = {
            fastName: "Dave"
        }

        const providers = {
            slowName: (ctx) => {
                slowProviderWasCalled = true
                return "Fred"
            }
        }

        await evaluateRule(rule, ctx, providers)

        expect(slowProviderWasCalled).toBe(false)
    })

    it("will run a slow rule if it has to", async () => {
        let slowProviderWasCalled = false

        const rule = [
            { slowName: "Fred" },
            { fastName: "Diego" }
        ]

        const ctx = {
            fastName: "Dave"
        }

        const providers = {
            slowName: () => {
                slowProviderWasCalled = true
                return "Fred"
            }
        }

        expect(await evaluateRule(rule, ctx, providers)).toBe(true)

        expect(slowProviderWasCalled).toBe(true)
    })

    it("will not mutate the passed-in context", async () => {
        const rule = { a: 1 }

        const ctx = {}

        const providers = {
            a: () => 1
        }

        expect(await evaluateRule(rule, ctx, providers)).toBeTruthy()
        expect(ctx.a).toBeUndefined()
    })
})

describe("selectValue", () => {
    it("can select a value", async () => {
        const value = await selectValue([{ rule: {a: 1}, value: "Hello" }], { a: 1 })
        expect(value).toBe("Hello")
    })

    it("will replace tokens from context", async () => {
        const ctx = { name: "Fred" }
        const rules = [
            { rule: {}, value: "Hello, {name}, nice to meet you, {name}"}
        ]
        expect(await selectValue(rules, ctx, {})).toBe("Hello, Fred, nice to meet you, Fred")
    })
})

describe("readValueFromService", () => {
    it("can read a value from a service", async () => {
        const result = await readValueFromService({ mpv: "mugs", culture: "en-IE" }, {}, {
            url: "https://merchandising-product-service.cdn.vpsvc.com/api/v3/MerchandisingProductView/vistaprint/{mpv}?locale={culture}&requestor=siteflow",
            jpathQuery: "coreProductId"
        })

        expect(result).toBe("PRD-LBZPHAVN")
    })
})