const { rulify } = require("./rulify")
const { materialize, getTypeof, getKeys, getLength } = require("./methods")

class Rulifier {
    #opts
    #root

    constructor(opts) {
        this.#opts = opts

        this.#root = rulify(...opts.dataSources, { $handlers: opts.handlers })
    }

    materialize(obj) {
        return materialize(obj)
    }

    applyContext(dataSource = {}) {
        return rulify(this.#root, dataSource)
    }

    getTypeof(obj) {
        return getTypeof(obj)
    }

    getKeys(obj) {
        return getKeys(obj)
    }

    getLength(obj) {
        return getLenght(obj)
    }
}

module.exports = {
    Rulifier,
    rulify,
    materialize,
    getTypeof,
    getKeys,
    getLength,
}
