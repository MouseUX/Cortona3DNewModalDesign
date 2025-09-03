/**
 * The UI component that is used to display an external HTML file, multimedia content like audio, video
 * or any RapidAuthor publication content (companion file, VRML file, compressed package) in the separate `IFRAME`.
 * @module components/iframe
 * @requires solo-uniview
 */
define(function (require, exports, module) {
    require('css!./iframe.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-iframe">
     *      <iframe class="cortona3dsolo-iframe"></iframe>
     * </div>
     * ```
     * ```xml
     * <div class="skin-iframe">
     *      <video class="cortona3dsolo-iframe"></video>
     * </div>
     * ```
     * ```xml
     * <div class="skin-iframe">
     *      <audio class="cortona3dsolo-iframe"></audio>
     * </div>
     * ```
     * @fires Cortona3DSolo~"uniview.showAllPanels"
     * @tutorial component-usage
     * @tutorial component-iframe
     */
    module.exports = function (skin, options, solo) {

        var element = skin.create('.skin-iframe'),
            m_urlLoad = '',
            m_iframe;

        var component = this;

        function safeProperty(object, name) {
            var p;
            try {
                p = object[name];
            } catch (e) { }
            return p;
        }

        function cleanUp() {
            if (m_iframe) {
                component.emit('beforeCleanUp');
                
                var iframeSolo = safeProperty(m_iframe.contentWindow, 'Cortona3DSolo');
                if (iframeSolo) {
                    iframeSolo.removeAllListeners();
                }
                m_iframe.onload = null;
                m_iframe.onerror = null;
                element.removeChild(m_iframe);
                m_iframe = null;
            }
            m_urlLoad = '';
        }

        /**
         * Unload external resources and delete `IFRAME` element.
         * 
         * @async
         * @memberof module:components/iframe
         * @returns {Promise} `Promise` that fulfilled when resource is unloaded successfully.
         */

        function unload() {
            cleanUp();
            return Promise.resolve();
        }

        /**
         * Loads an external HTML file into the `IFRAME`.
         * 
         * @async
         * @memberof module:components/iframe
         * @param {string} url 
         * @param {object} options
         * @param {boolean} options.reloadFrame
         * @returns {Promise} `Promise` that fulfilled when resource is loaded successfully.
         */
        function load(resourceUrl, options) {

            options = options || {};

            if ((resourceUrl === m_urlLoad) && !options.reloadFrame) {
                return Promise.resolve();
            }

            solo.dispatch('uniview.showAllPanels');

            cleanUp();
            m_iframe = element.appendChild(skin.create('iframe.cortona3dsolo-iframe'));

            return new Promise(function (resolve, reject) {

                m_iframe.src = resourceUrl;

                m_iframe.onload = function () {
                    m_urlLoad = resourceUrl;

                    var iframeSolo = safeProperty(m_iframe.contentWindow, 'Cortona3DSolo');
                    if (iframeSolo) {
                        iframeSolo.once('uniview.ready', function () {
                            resolve();
                        });
                    } else {
                        //already load if have not Cortona3DSolo object
                        resolve();
                    }
                };

                m_iframe.onerror = function () {
                    reject();
                };
            });
        }

        /**
         * Loads the inline HTML content into the `IFRAME`.
         * 
         * @async
         * @memberof module:components/iframe
         * @param {string} content The inline HTML to embed into the `IFRAME` element
         * @returns {Promise} `Promise` that fulfilled when resource is loaded successfully.
         */
        function loadContent(content) {
            solo.dispatch('uniview.showAllPanels');

            cleanUp();
            m_iframe = element.appendChild(skin.create('iframe.cortona3dsolo-iframe'));

            return new Promise(function (resolve, reject) {

                m_iframe.srcdoc = content;

                m_iframe.onload = function () {
                    var iframeDocument = this.contentDocument;
                    if (!iframeDocument.body.children.length) {
                        // Edge?
                        iframeDocument.open('text/html', 'replace');
                        iframeDocument.write(content);
                        iframeDocument.close();
                    } else {
                        var iframeSolo = safeProperty(this.contentWindow, 'Cortona3DSolo');
                        if (iframeSolo) {
                            iframeSolo.once('uniview.ready', resolve);
                        } else {
                            //already load if have not Cortona3DSolo object
                            resolve();
                        }
                    }
                };

                m_iframe.onerror = function () {
                    reject();
                };
            });
        }

        /**
         * Loads the RapidAuthor publication content (companion and VRML files, a compressed package) into the `IFRAME` using the new `solo-uniview` instance.
         * 
         * @async
         * @memberof module:components/iframe
         * @param {string} src The URL to load the RapidAuthor content.
         * @param {object} options The object is used as options object `Cortona3DSolo.uniview.options` of the `solo-uniview` instance in the `IFRAME`.
         * @param {number} options.totalMemory Total memory used by the Cortona3D Solo instance in the `IFRAME`.
         * @param {number} options.features A features bitmask of the Cortona3D Solo instance in the `IFRAME`.
         * @param {string|function} options.factory The name of the customization module or its factory function of the `solo-uniview` instance in the `IFRAME`.
         * @param {string} options.lang Language code override for the UI.
         * @param {boolean} options.reloadFrame
         * @param {boolean} options.soloOnly
         * @returns {Promise} `Promise` that fulfilled when resource is loaded successfully.
         */
        function loadSoloResource(src, options) {
            solo.dispatch('uniview.showAllPanels');

            options = options || {};

            if ((m_urlLoad === src) && !options.reloadFrame) {
                return Promise.resolve();
            }

            cleanUp();
            m_iframe = element.appendChild(skin.create('iframe.cortona3dsolo-iframe'));

            var content = '<!DOCTYPE html><html><head>\
            <style>html,body{margin:0;overflow:hidden;}main.solo-uniview-content{padding:0;}</style>\
            <script src="' + solo.baseUrl + 'Cortona3DSolo.js"></script>\
            </head></html>';

            return new Promise(function (resolve, reject) {
                m_urlLoad = src;

                m_iframe.src = 'about:blank';

                function done() {
                    var iframeSolo = safeProperty(this.defaultView, 'Cortona3DSolo');
                    if (iframeSolo) {
                        solo.expand(iframeSolo, {
                            baseUrl: solo.baseUrl,
                            uniview: {
                                options: solo.expand({ dismissSystemMessage007: true }, options)
                            }
                        });
                        if (options.soloOnly) {
                            resolve();
                        } else {
                            solo.use('skin')
                                .then(function (module) {
                                    iframeSolo.use('skin', {
                                        baseUrl: module.config.baseUrl
                                    });
                                    iframeSolo.once('uniview.ready', resolve);
                                    return iframeSolo.skin.create('app').use('solo-uniview', solo.expand({
                                        totalMemory: 64,
                                        features: 0
                                    }, options, {
                                        src: src
                                    }));
                                })
                                .catch(reject);
                        }
                    } else {
                        //already load if have not Cortona3DSolo object
                        resolve();
                    }
                }

                m_iframe.onload = function () {
                    m_iframe.onload = null;

                    var iframeDocument = this.contentDocument;
                    if (iframeDocument) {
                        iframeDocument.open('text/html', 'replace');
                        iframeDocument.write(content);
                        iframeDocument.close();

                        if (iframeDocument.readyState === 'complete') {
                            done.call(iframeDocument);
                        } else {
                            iframeDocument.addEventListener('DOMContentLoaded', done);
                        }
                    } else {
                        var msg;
                        try {
                            void this.contentWindow.document;
                        } catch (e) {
                            msg = e.message;
                        }
                        reject(msg);
                    }
                };

                m_iframe.onerror = function (event) {
                    reject(event.message);
                };
            });
        }

        /**
         * Creates the `VIDEO` element and plays the video content.
         * 
         * @async
         * @memberof module:components/iframe
         * @param {string} url 
         * @param {object} [options] 
         * @param {boolean} options.controls
         * @param {boolean} options.muted
         * @param {boolean} options.loop
         * @param {boolean} options.autoplay
         * @param {string} options.preload
         * @param {string} options.poster
         * @returns {Promise} `Promise` that fulfilled when resource is loaded successfully.
         */
        function loadVideo(url, options) {
            if (m_urlLoad === url) {
                return Promise.resolve();
            }

            solo.dispatch('uniview.showAllPanels');

            options = options || {};

            cleanUp();
            m_iframe = element.appendChild(skin.create('video.cortona3dsolo-iframe', {
                src: url,
                controls: options.controls,
                muted: options.muted,
                loop: options.loop,
                autoplay: options.autoplay,
                preload: options.preload,
                poster: options.poster
            }));

            m_urlLoad = url;
            return Promise.resolve();
        }

        /**
         * Creates the `AUDIO` element and plays the audio content.
         * 
         * @async
         * @memberof module:components/iframe
         * @param {string} url 
         * @param {object} [options] 
         * @param {boolean} options.controls
         * @param {boolean} options.muted
         * @param {boolean} options.loop
         * @param {boolean} options.autoplay
         * @param {string} options.preload
         * @returns {Promise} `Promise` that fulfilled when resource is loaded successfully.
         */
        function loadAudio(url, options) {
            if (m_urlLoad === url) {
                return Promise.resolve();
            }

            options = options || {};

            solo.dispatch('uniview.showAllPanels');

            cleanUp();
            m_iframe = element.appendChild(skin.create('audio.cortona3dsolo-iframe', {
                src: url,
                controls: options.controls,
                muted: options.muted,
                loop: options.loop,
                autoplay: options.autoplay,
                preload: options.preload
            }));

            m_urlLoad = url;
            return Promise.resolve();
        }

        Object.defineProperties(this, {
            'load': {
                value: load,
                enumerable: true
            },
            'loadContent': {
                value: loadContent,
                enumerable: true
            },
            'loadSoloResource': {
                value: loadSoloResource,
                enumerable: true
            },
            'loadVideo': {
                value: loadVideo,
                enumerable: true
            },
            'loadAudio': {
                value: loadAudio,
                enumerable: true
            },
            'unload': {
                value: unload,
                enumerable: true
            },
            /**
             * Gets `window` of the `IFRAME` for the HTML or RapidAuthor content.
             * 
             * Gets `VIDEO` or `AUDIO` element for the multimedia content.
             * 
             * @member {Window|HTMLVideoElement|HTMLAudioElement} window
             * @memberof module:components/iframe
             */
            'window': {
                get: function () {
                    if (m_iframe) {
                        return m_iframe.contentWindow || m_iframe;
                    }
                },
                enumerable: true
            },
            /**
             * Returns a property of the {@link module:components/iframe.window} object, or undefined if it is not available.
             * 
             * @method safeProperty
             * @memberof module:components/iframe
             * @param {string} name
             * @returns {*} A property object or undefined
             */
            'safeProperty': {
                value: function (name) {
                    return safeProperty(this.window, name);
                },
                enumerable: true
            }
        });

        return this.exports(element);
    };
});