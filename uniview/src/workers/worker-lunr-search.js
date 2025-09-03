require('es6-promise/auto'); // require Promise polyfill for IE

var lunr = require('lunr');
require('lunr-languages/lunr.stemmer.support')(lunr);
require('lunr-languages/lunr.multi')(lunr);
require('lunr-languages/tinyseg')(lunr);
require('lunr-languages/lunr.de')(lunr);
require('lunr-languages/lunr.fr')(lunr);
require('lunr-languages/lunr.it')(lunr);
require('lunr-languages/lunr.ja')(lunr);
require('lunr-languages/lunr.ko')(lunr);
require('lunr-languages/lunr.ru')(lunr);
require('lunr-languages/lunr.zh')(lunr);

/* fix a bug in lunr.ko.wordCharacters */
lunr.ko.wordCharacters = '\\w\uac00-\ud7a3';

var idxPromise = Promise.resolve();
var cancelled;
var running;
var request;

self.onmessage = function (e) {
    switch (e.data.type) {
        case 'init':
            idxPromise = new Promise(function (resolve) {
                var idx = lunr(function () {
                    this.use(lunr.multiLanguage('en', 'de', 'fr', 'ja', 'ru', 'it', 'zh', 'ko'));
                    this.ref('id');
                    this.field('text');
                    this.metadataWhitelist = ['position'];
                    var dataLength = e.data.searchData.length,
                        progressThreshold = Math.round(dataLength / 100);
                    for (var i = 0; i < dataLength; i++) {
                        this.add(e.data.searchData[i]);
                        if (i % progressThreshold === 0) {
                            self.postMessage({
                                progress: {
                                    loaded: i,
                                    total: dataLength,
                                    type: 'progress'
                                }
                            });
                        }
                    }
                    self.postMessage({
                        progress: {
                            loaded: 0,
                            total: -1,
                            type: 'load'
                        }
                    });
                });
                resolve(idx);
                if (e.data.log) {
                    console.log(JSON.stringify(idx));
                }
            });
            break;
        case 'load':
            idxPromise = new Promise(function (resolve, reject) {
                function complete(e) {
                    self.postMessage({
                        progress: {
                            loaded: 0,
                            total: -1,
                            type: e.type
                        }
                    });
                    if (e.type !== 'load') {
                        reject();
                    }
                }
                var xhr = new XMLHttpRequest();
                xhr.overrideMimeType('text/json');
                xhr.open("GET", e.data.indexUrl, true);
                xhr.responseType = 'json';
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200 || xhr.status === 0) {
                            lunr.multiLanguage('en', 'de', 'fr', 'ja', 'ru', 'it', 'zh', 'ko');
                            resolve(lunr.Index.load(xhr.response));
                        } else {
                            reject();
                        }
                    }
                };
                xhr.onload = complete;
                xhr.onerror = complete;
                xhr.onabort = complete;
                xhr.onprogress = function (e) {
                    self.postMessage({
                        progress: {
                            loaded: e.loaded,
                            total: e.lengthComputable || e.lengthComputable === undefined ? e.total : 0,
                            type: e.type
                        }
                    });
                };
                xhr.send(null);
            });
            break;
        case 'cancel':
            if (running) {
                cancelled = true;
            }
            self.postMessage({});
            break;
        default:
            request = e.data.searchText;
            cancelled = false;
            if (!running) {
                running = true;
                idxPromise
                    .then(function (idx) {
                        if (!idx) return;
                        if (!cancelled) {
                            var result = idx.search(request);
                            self.postMessage({
                                result: result
                            });
                        }
                    })
                    .catch(function (e) {
                        self.postMessage({
                            error: e
                        });
                    })
                    .finally(function () {
                        running = false;
                    });
            }
    }
};