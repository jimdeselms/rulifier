# rulifier

Rulifier is a light-weight rule engine designed for speed and ease-of-use.

Rulifier allows you to define a number of data sources and rules. Then, by providing additional context, you can evaluate those rules.

Rulifier comes with a small set of builtin rules, but you can also build you rown rules, and you can compose new rules out of the existing ones.

## An example

```Javascript

const { Rulifier } = require("rulifier")

async function run() {
    // First, define the set of data sources. In this example,
    // we only have one.
    const rulifier = new Rulifier([
        {
            // We have a property "words" which will contain different
            // values depending on the language.
            //
            // Note that the 'language' property is not defined in this
            // data source; we'll prove that context later.
            words: {
                $switch: {
                    cases: [
                        {
                            // This means, "if the property 'language' equals 'en'...
                            condition: {
                                $match: {
                                    language: "en"
                                }
                            },
                            // Then the 'words' property has these two values
                            value: {
                                hello: "Hello",
                                world: "World"
                            }
                        },
                        {
                            // Likewise, if 'language' is 'es',
                            condition: {
                                $match: {
                                    language: "es"
                                }
                            }
                            // Then use these Spanish values
                            value: {
                                hello: "Hola",
                                world: "Mundo"
                            }
                        },
                    ]
                }
            },
            // The property 'greeting' uses string interpolation to get the
            // properties words.hello and words.world, as defined above.
            greeting: { $str: "${words.hello}, ${words.world}!" }
        }
    ])

    // Now, take the rulifier we created and define the language 
    // property, which is needed to resolve the rules above.
    // 
    // The result here is a Javascript proxy that you can use to 
    // walk the properties defined above to get values.
    // 
    // You can access all the properties on result and store them 
    // in variables and pass them into other functions. HOWEVER,
    // you can't get the actual result of evaluating the rules
    // until the next step: materialize.
    const result = rulifier.applyContext({ 
        language: "en"
    })

    // "materialize" takes a propery from your rulified result above
    // and evaluates the rules, turning it into a fully-materialized
    // Javascript object (it's no longer a proxy.)
    const greeting = await rulifier.materialize(result.greeting))
    console.log(greeting) // Output: Hello, World!

    // You can dig down as far as you want into the structure and get
    // the individual words if you like:
    const hello = await rulifier.materialize(result.words.hello)
    console.log(hello) // Output: Hello
}
```

## Defining rules

In the previous example, we define a `language` in our call to `applyContext`. However, you might want to define
different behavior, not only by language, but also by counry. Instead of defining `language`, let's try defining a `culture` context (such as "en-US".) We can still use our existing rules.

The `Rulifier` constructor accepts an options argument which can define various rules. Note that rules names
always begin with `$`.

```Javascript

const rulifier = new Rulifier([,
        {
            /* ... the data source from above ... */
        },
        {
            // Define "language" and "country" by reading the "culture" value from context,
            // and passing it throught the $stripLanguage and $stripCountry rules.
            language: { $stripLanguage: { $ref: "culture" } },
            country: { $stripCountry: { $ref: "culture" } }
        }
    ],
    {
        rules: {
            // Rules are really just asynchronous functions.
            // The `obj` parameter is the object that is passed to it. (The result of the $ref rule above.)
            // The `sdk` parameter is a collection of helpers to access the properties of the `obj` parameter.
            // 
            // Note that `obj` is a proxy, so you can't use it directly without first calling `materialize`.
            async $stripLanguage(obj, sdk) {
                const culture = await sdk.materialize(obj)
                // Given 'en-US', return 'en'
                return culture.substr(0,2)
            },
            async $stripCountry(obj, sdk) {
                const culture = await sdk.materialize(obj)
                // Given 'en-US', return 'us'
                return culture.substr(3, 2).toLowerCase()
            }
        }
    })
```

## Built-in rules

### `$ref`

The `$ref` rule reads a value from the 

```typescript
{ $ref: string }
```

Example: 

For this example, we'll assume that we have these data sources and context:
```javascript
{
    people: [
        {
            name: "John Donson",
            address: {
                street: "1 Main Street",
                city: "Hitsville",
                country: "USA"
            }
        }
    ]
}
```

We can use this `$ref` to reference the city above:
```javascript
{
    $ref: "people[0].address.city"
}
```



## Performance

Rulifier is fast for several reasons:
* Rules are evaluated lazily, and only if they need to be
* Results are cached so that if you evaluate the same rule with the same context, you'll get the same cached result. (The cache is cleared as soon as you apply a new context to your rule set.)
* Since boolean rules (like `$or` and `$and`) will short circuit as soon as it can be determined that the
rule is true or false, the cases are sorted in order of complexity; if you have an expensive term in your `$or` statement, you may be able to quickly determine that you don't need to evaluate it at all.

## Usage




