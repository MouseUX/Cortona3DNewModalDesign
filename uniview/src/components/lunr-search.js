/**
 * The component that is used to search a text using {@link https://lunrjs.com/ Lunr} engine.
 * @module static/lunr-search
 */
define(function (require, exports, module) {

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {string} [options.indexUrl]
     * @param {boolean} [options.serializedIndex=false] If true, the `indexUrl` option is interpreted as the Lunr serialized index.
     * @param {Cortona3DSolo} solo
     * @return {object}
     * @tutorial component-usage
     * @tutorial component-lunr-search
     */
    module.exports = function (skin, options, solo) {
        var LunrWorker = require('worker!workers/worker-lunr-search.js'),
            worker = new LunrWorker(),
            indexPromise;

        if (options.serializedIndex) {
            indexPromise = Promise.resolve();
            worker.postMessage({
                type: 'load',
                indexUrl: options.indexUrl
            });
        } else {
            indexPromise = solo.app.loadCompanionFile(options.indexUrl)
                .then(function (data) {
                    var items = data.interactivity.json.$('index/item');
                    worker.postMessage({
                        log: options.logIndex,
                        type: 'init',
                        searchData: items.map(function (item) {
                            return {
                                id: item.$attr('id'),
                                text: item.$text('html')
                            };
                        })
                    });
                    return data;
                })
                .catch(console.error.bind(console));
        }

        /**
         * Cancels the last search operation.
         */
        function cancel() {
            worker.postMessage({
                type: 'cancel'
            });
        }

        /**
         * Performs a search against the index using lunr query syntax.
         * 
         * @param {string} queryString 
         * @fires Cortona3DSolo~"index.onProgress"
         */
        function search(queryString) {
            return indexPromise.then(function () {
                return new Promise(function (resolve, reject) {
                    worker.onmessage = function (e) {
                        if (e.data.result) {
                            resolve(e.data.result);
                        } else if (e.data.progress) {
                            solo.dispatch('index.onProgress', e.data.progress.loaded, e.data.progress.total, e.data.progress.type);
                        } else {
                            reject(e.data.error);
                        }
                    };
                    worker.postMessage({
                        searchText: queryString,
                    });
                });
            });
        }

        return {
            search: search,
            cancel: cancel
        };
    };
});

/**
 * It is used to indicate that loading operation of the search index is in progress.
 * When the download is complete, the parameter `total` is -1.
 * 
 * @event Cortona3DSolo~"index.onProgress"
 * @type {arguments} 
 * @prop {number} position The amount of data currently transferred
 * @prop {number} total The total amount of data to be transferred
 * @prop {string} type The event's type:
 * - "progress"
 * - "load"
 * - "error"
 * - "abort"
 */