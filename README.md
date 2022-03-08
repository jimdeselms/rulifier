# rulifier

Rulifier is a light-weight rule engine designed for speed and ease-of-use.

Rulifier allows you to define a number of data sources and rules. Then, by providing additional context, you can evaluate those rules
using the given context. 

Rulifier evaluates data lazily, and only 

```Javascript

const { Rulifier } = require("rulifier")

async function run() {
    const rulifier = new Rulifier({
        dataSources: [
            {
                words: {
                    $switch: {
                        cases: [
                            {
                                condition: {
                                    $match: {
                                        language: "en"
                                    }
                                },
                                value: {
                                    hello: "Hello",
                                    world: "World"
                                }
                            },
                            {
                                condition: {
                                    $match: {
                                        language: "es"
                                    }
                                }
                                value: {
                                    hello: "Hola",
                                    world: "Mundo"
                                }
                            },
                        ]
                    }
                },
                greeting: { $str: "${words.hello}, ${words.world}!" }
            }
        ]
    })

    const result = rulifier.applyContext({ language: "en" })

    console.log(await rulifier.materialize(result.greeting))

    // Output: Hello, World!
}
```

## Usage




