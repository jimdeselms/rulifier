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

# Built-in rules

## `$ref`

The `$ref` accepts a string path and, starting from the root of the object, follows the properties down to the referenced property.

The path uses typical Javascript syntax for accesssing a string of properties, such as `person.address.city`. You can also refrence
arary elements by index, such as `people[0].address.city`

```typescript
{ $ref: string } // returns any
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
    ],
    // This evaluates to "Hitsville
    johnCity: {
        $ref: "people[0].address.city"
    }
}
```

## `$str`

The `$str` rule allows you to reference properties using string interpolation, and replace those references with the values of those references.

```typescript
{ $str: string } // returns string
```

Properties are referenced using the syntax `${reference}`.

Given the `$ref` example above, we could add this context:

```javascript
{
    ...
    // This evalutes to "Good morning, John Donson, how are things in Hitsville?"
    johnGreeting: { $str: "Good morning, ${people[0].name}, how are things in ${johnCity}?" }
}
```

## Boolean rules `$and`, `$or`, and `$not`

```typescript
{ $and: boolean[] } // returns boolean
{ $or: boolean[] } // returns boolean
{ $not: boolean } // returns boolean
```

`$and` takes an array of expressions and returns `true` if they are all truthy. If the
given array is empty, then `$and` returns true.

Likewise, `$or` returns false if any of the expressions is falsy, and if the array is
empty, then `$or` returns false.

`$and` and `$or` will short-circuit -- that is -- they will only evaluate expressions for
as long as it takes to determine the result. 

**NOTE** - unlike most languages, the expressions are not evaluated in the given order, but rather,
the expressions are sorted by cost, evaluating the least-expensive predicates first.

`$not` will return the boolean opposite of the given expression. It returns `true` if expression is falsy, and `false` if the expression is truthy.

## `$if`

```typescript
{
    $if: {
        condition: boolean,
        then: any
        else: any
    }
}
```

# Performance

Rulifier is fast for several reasons:
* Rules are evaluated lazily, and only if they need to be
* Results are cached so that if you evaluate the same rule with the same context, you'll get the same cached result. (The cache is cleared as soon as you apply a new context to your rule set.)
* Since boolean rules (like `$or` and `$and`) will short circuit as soon as it can be determined that the
rule is true or false, the cases are sorted in order of complexity; if you have an expensive term in your `$or` statement, you may be able to quickly determine that you don't need to evaluate it at all.

## Usage




