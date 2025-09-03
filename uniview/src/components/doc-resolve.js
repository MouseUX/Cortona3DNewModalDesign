/**
 * A helper component to load and process the HTML representation of a document.
 * @module components/doc-resolve
 * @requires solo-uniview
 */
define(function (require, exports, module) {
    require('css!./doc-resolve.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {boolean} [options.disable3DLink=false] Disables all 3D links in the document.
     * @param {module:components/doc-resolve~testDataLink} [options.testDataLink] The function defines the condition for enabling the link.
     * @param {object} [options.handlers={}] The namespace which defines handlers to process links. 
     * The handler name must be the same as the value of the `data-link` attribute of the link element. See {@link module:components/doc-resolve~resolveLinks resolveLinks}. 
     * @param {module:components/doc-resolve~documentLinkHandler} [options.handlers.link3d] Handler to process 3D link.
     * @param {module:components/doc-resolve~documentLinkHandler} [options.handlers.link2d] Handler to process 2D link.
     * @param {module:components/doc-resolve~documentLinkHandler} [options.handlers.linkMedia] Handler to process media link.
     * @param {module:components/doc-resolve~documentLinkHandler} [options.handlers.toggleStatus] Handler to toggle the status section in the document.
     * @param {boolean} [options.preventFetchDocument=false] Prevents fetching of the document.
     * @param {string} [options.documentTemplateURL] The URL to load the HTML representation of the document.
     * @param {Cortona3DSolo} solo
     * @returns {object}
     * @fires Cortona3DSolo~"uniview.doc.didActivateLink"
     * @see module:components/doc
     * @tutorial component-usage
     * @tutorial component-doc-resolve
     */
    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            m_documentTemplateBaseUrl,
            m_templateFromBundle = true;

        /**
         * Adds a click event listener to all links in the document, 
         * which calls the appropriate handler from the component options with a name equal to the value of the `data-link` attribute. 
         * 
         * The link is an element with the class name `.link` and the `data-link` attribute which defines the reference type:
         * ```xml
         * <a class="link" data-link="link3d">3D Sample</a>
         * ``` 
         * 
         * @param {HTMLElement} element The root element of the HTML representation of the document.
         */
        function resolveLinks(element) {

            if (options.disable3DLink) {
                // 2d only, remove link3d
                element.querySelectorAll('.link[data-link=link3d]').forEach(function (el) {
                    el.classList.remove('link3d');
                    el.classList.remove('link');
                });
            }

            var testDataLink = (typeof options.testDataLink === 'function') ? options.testDataLink : function () {
                return true;
            };

            var isFiltered,
                dataLinkValue,
                el,
                handlers = options.handlers || {};

            element.querySelectorAll('.link')
                .forEach(function (link) {
                    dataLinkValue = link.getAttribute('data-link');

                    if (dataLinkValue && testDataLink.call(link, dataLinkValue)) {
                        link.onclick = function (event) {
                            isFiltered = false;
                            el = event.target;
                            while (el && el.classList && !isFiltered) {
                                isFiltered = el.classList.contains('filterHide');
                                el = el.parentNode;
                            }
                            if (!isFiltered) {
                                var method = this.getAttribute('data-link');
                                if (typeof handlers[method] === 'function') {
                                    handlers[method].call(this, event);
                                    /**
                                     * The event is fired when a link in the document is activated.
                                     * @event Cortona3DSolo~"uniview.doc.didActivateLink"
                                     * @type {arguments}
                                     * @prop {string} name Link function name
                                     * @prop {HTMLElement} element Link element
                                     */
                                    solo.dispatch('uniview.doc.didActivateLink', method, this);
                                } else {
                                    console.error('No handler for ' + method);
                                }
                            }
                            event.stopPropagation();
                        };
                        link.querySelectorAll('a[href]')
                            .forEach(function (a) {
                                a.addEventListener('click', function (event) {
                                    event.stopPropagation();
                                });
                            });
                    } else {
                        link.classList.remove('link');
                    }
                });
        }

        /**
         * Resolves the URL of images, videos, audios and objects in the document to fetch resource from the correct URL, relative to the loaded companion file or from the compressed package.
         * 
         * @param {HTMLElement} element The root element of the HTML representation of the document.
         */
        function resolveImages(element) {
            element.querySelectorAll('img, video, audio').forEach(function (image) {
                var src = image.getAttribute('src') || '',
                    svgext = solo.uniview.options.UseCompressedSVG ? '.svgz' : '.svg';
                src = src.replace(/\.cgm$/i, svgext);
                if (m_templateFromBundle) {
                    if (m_documentTemplateBaseUrl) {
                        image.src = solo.app.getResourceUrl(m_documentTemplateBaseUrl.replace(/[^\\\/]+$/, src));
                    } else {
                        image.src = solo.app.getResourceUrl(src);
                    }
                } else {
                    image.src = solo.app.getResourceUrl(src, m_documentTemplateBaseUrl);
                }
            });
            element.querySelectorAll('object').forEach(function (object) {
                var src = object.getAttribute('data') || '';
                if (m_templateFromBundle) {
                    if (m_documentTemplateBaseUrl) {
                        object.data = solo.app.getResourceUrl(m_documentTemplateBaseUrl.replace(/[^\\\/]+$/, src));
                    } else {
                        object.data = solo.app.getResourceUrl(src);
                    }
                } else {
                    object.data = solo.app.getResourceUrl(src, m_documentTemplateBaseUrl);
                }
            });
        }

        /**
         * Returns the syntax of the HTML representation of the document.
         * 
         * Use the following search order:
         * 1. Use the `documentTemplateURL` parameter from the component options to load the HTML fragment from the URL.
         * 2. Use the `SimulationInteractivity/DocumentTemplate/@src` attribute value from the companion file to load the HTML fragment from the URL.
         * 3. Use the text content of the `SimulationInteractivity/DocumentTemplate` element from the companion file as the HTML representation of the document.
         * 
         * Returns an empty string in the following cases:
         * 1. If the `preventFetchDocument` parameter from the component options is `true`.
         * 2. If the `SimulationInteractivity/DocumentTemplate` element does not exist in the companion file.
         * 
         * @async
         * @returns {Promise.<string>} The Promise object whose fulfillment handler receives a string
         * with the HTML syntax of the document that is associated with the loaded companion file or empty string if the HTML fragment is unavailable. 
         * A promise is rejected if the HTML fragment failed to load.
         * @tutorial document-html-view
         */
        function documentTemplateHtml() {
            return Promise
                .resolve(ixml.json.$('SimulationInteractivity/DocumentTemplate')[0])
                .then(function (documentTemplate) {
                    if (options.preventFetchDocument) {
                        return '';
                    }

                    if (!documentTemplate && !options.documentTemplateURL) {
                        console.error('<DocumentTemplate> node not found in the interactivity.xml. Switching to comments view.');
                        return '';
                    }

                    var templateUrl = options.documentTemplateURL || documentTemplate.$attr('src');

                    if (!templateUrl) {
                        return documentTemplate.$text();
                    }

                    var url = solo.app.getResourceUrl(templateUrl);

                    return solo.app.util.loadResource(url)
                        .then(function (xhr) {
                            m_templateFromBundle = /^blob:/i.test(url);
                            m_documentTemplateBaseUrl = m_templateFromBundle ? templateUrl : url;
                            return xhr.response ? Promise.resolve(xhr.response) : Promise.reject();
                        })
                        .catch(function () {
                            console.error('Failed loading external document template from "' + url + '".');
                            return Promise.resolve(documentTemplate ? documentTemplate.$text() : '');
                        });
                });
        }

        var t_checkVisibilty,
            n_checkVisibilty = null;

        solo.on('app.procedure.didChangePlayerState', function () {
            function checkVisibilty(el) {
                var handles = ixml.getObjects(el.dataset.key.split(' ')),
                    visible = handles.some(function (handle) {
                        return solo.app.getObjectVisibility(handle) === 0;
                    });

                if (visible) {
                    el.classList.remove('disabled');
                } else {
                    el.classList.add('disabled');
                }
            }

            function nextChunk() {
                var t = new Date();
                while (n_checkVisibilty && n_checkVisibilty.length && (new Date() - t) < 10) {
                    checkVisibilty(n_checkVisibilty.pop());
                }
                if (n_checkVisibilty && n_checkVisibilty.length) {
                    t_checkVisibilty = setTimeout(nextChunk);
                } else {
                    n_checkVisibilty = null;
                }
            }

            clearTimeout(t_checkVisibilty);

            var currentStepParts = Array.prototype.slice.call(document.querySelectorAll('.active a.link[data-link="link3d"][data-context="part"], .active a.link[data-link="link3d"][data-context="item"]'))
                .map(function (n) {
                    return n.dataset.key;
                });

            n_checkVisibilty = Array.prototype.slice.call(document.querySelectorAll('a.link[data-link="link3d"][data-context="part"], a.link[data-link="link3d"][data-context="item"]'))
                .sort(function (a, b) {
                    var aid = a.dataset.key,
                        bid = b.dataset.key,
                        ka = currentStepParts.indexOf(aid) < 0 ? 0 : 1,
                        kb = currentStepParts.indexOf(bid) < 0 ? 0 : 1;
                    if (ka > kb) return 1;
                    if (ka < kb) return -1;
                    return 0
                });
            nextChunk();
        });

        return {
            resolveImages: resolveImages,
            resolveLinks: resolveLinks,
            documentTemplateHtml: documentTemplateHtml
        };
    };
});

/**
 * The function defines the condition for enabling the link depending of the value of the `data-link` attribute. 
 *
 * `this` points to a reference to the link element&nbsp;&ndash; HTMLElement.
 * 
 * Must return `true` if the link is enabled.
 * 
 * @callback module:components/doc-resolve~testDataLink
 * @this HTMLElement
 * @param {string} dataLinkValue
 * @returns {boolean}
 */

/**
 * The function determines the actions that will be performed when the corresponding link is activated in the document.
 * 
 * `this` points to a reference to the link element&nbsp;&ndash; HTMLElement.
 * 
 * @callback module:components/doc-resolve~documentLinkHandler
 * @this HTMLElement
 * @param {Event} event
 */