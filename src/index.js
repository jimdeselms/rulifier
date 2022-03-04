const { rulify } = require("./rulify")
const { materialize, getTypeof, getKeys, getLength } = require("./methods")

class Rulifier {
    #opts
    #root

    constructor(opts) {
        opts = opts ?? {}
        this.#opts = opts

        const dataSources = opts.dataSources
            ? Array.isArray(opts.dataSources) ? opts.dataSources : [ opts.dataSources ]
            : []

        this.#root = rulify(...dataSources, { $handlers: opts.handlers })
    }

    /**
     * 
     * @param {any} obj 
     * @returns {Promise<any>}
     */
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
        return getLength(obj)
    }
}

module.exports = Rulifier
