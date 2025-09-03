/**
 * A base module. Enables the following:
 * - Defines the common application layout 
 * - Loads the data of the publication
 * - Loads the customization module for the loaded data
 * @module solo-uniview
 * @requires module:components/progress
 * @requires module:components/modal
 * @requires module:components/loading
 */
define(function (require, exports, module) {
    //style
    require('css!./main.css');
    require('css!./solo-uniview.css');

    // IE11 polyfills
    require('lib/ie11CustomProperties');

    // build vars
    var PRODUCTION,
        VIEWER_VERSION,
        VIEWER_DESCRIPTION;

    var DEFAULT_VIEWER_DESCRIPTION = 'Cortona3D Solo Universal Viewer';

    var isIE = !!window.MSInputMethodContext && !!document.documentMode;

    window.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    window.addEventListener('mousedown', function (e) {
        if (e.shiftKey & 1) {
            e.preventDefault();
        }
    });

    /**
     * A factory function.
     * @async
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {string} options.baseUrl="spec/" The ralative path to load the customization module.
     * @param {string} options.src The URL to load the data of a publication.
     * @param {boolean} options.treatSrcAsCompanionFile The `options.src` value is treated as a companion file.
     * @param {boolean} options.treatSrcAsImageFile The `options.src` value is treated as an image file.
     * @param {number} options.totalMemory Total memory used by the Cortona3D Solo core in MB.
     * @param {number} options.features A features bitmask of the Cortona3D Solo instance. 
     * @param {boolean} options.disableAlternateSkin Prevents the load of the alternative customization module if there is the failure to load the default customization module for the publication.
     * @param {boolean} options.disableHashChangeHandler Prevents processing of the `window.onhashchange` event
     * @param {function|string} options.factory Explicitly specifies the customization module in the form of a factory function or the name of a customization module.
     * @param {string} options.appType Explicitly specifies the name of the default customization module.
     * @param {string} options.altType Explicitly specifies the name of an alternate customization module.
     * @param {string} options.lang Explicitly specifies the language code to use internationalization by default
     * @param {object} options.components
     * @param {factory} options.components.uiProgress A factory function of the {@link module:components/progress components/progress} component
     * @param {factory} options.components.uiLoading A factory function of the {@link module:components/loading components/loading} component
     * @param {factory} options.components.uiModal A factory function of the {@link module:components/modal components/modal} component
     * @param {factory} options.components.uiSplitter A factory function of the {@link module:components/splitter components/splitter} component
     * @param {factory} options.components.uiCanvasKeymap A factory function of the component to control the 3D window using the keyboard.
     * @param {factory} options.components.uiAlert A factory function of the {@link module:components/progress components/alert} component
     * @param {boolean} options.skipUIPublishOptions=false Prevent the use of UI settings from the publish options
     * @param {boolean} options.useDiscardableGeometryData=false 
     * @param {boolean} options.useAntialiasingGLES3=false 
     * @param {boolean} options.useGLES2=false 
     * @param {boolean} options.useVertexArrayObjectOES=false 
     * @param {boolean} options.soloRequiredVersion="2.0.0" The minimum required version of the Cortona3D Solo library
     * @param {Cortona3DSolo} solo
     * @return {Promise.<Cortona3DSolo.uniview>} `Promise` whose fulfillment handler receives an {@link Cortona3DSolo.uniview} object.
#### HTML layout
```xml
<div class="skin-holder skin-holder-app" role="application">
	<header class="solo-uniview-header"></header>
	<main class="solo-uniview-content">
		<div class="main panel">
			<div class="main-content panel">
				<div class="skin-holder skin-holder-main">
					<div class="panel-view">
						<div class="skin-holder skin-holder-view">
							<canvas></canvas>
							<svg></svg>
						</div>
					</div>
				</div>
			</div>
			<div class="skin-split-pane main-splitter"></div>
			<div class="main-secondary panel">
				<div class="skin-holder skin-holder-mainsecondary"></div>
			</div>
		</div>
		<div class="skin-split-pane"></div>
		<div class="aux panel">
			<div class="aux-content panel">
				<div class="skin-holder skin-holder-aux"></div>
			</div>
			<div class="skin-split-pane aux-splitter"></div>
			<div class="aux-secondary panel">
				<div class="skin-holder skin-holder-auxsecondary"></div>
			</div>
		</div>
	</main>
	<footer class="solo-uniview-footer"></footer>
</div>
```
#### Available skins
```javascript
var main = solo.skin.get('main'),
    view = solo.skin.get('view'),
    aux = solo.skin.get('aux'),
    mainSecondary = solo.skin.get('main-secondary'),
    auxSecondary = solo.skin.get('aux-secondary');
```
     * @listens Cortona3DSolo~"uniview.error"
     * @listens Cortona3DSolo~"uniview.toggleMainPanelOnlyMode"
     * @listens Cortona3DSolo~"uniview.toggleAuxPanelOnlyMode"
     * @listens Cortona3DSolo~"uniview.showAllPanels"
     * @listens Cortona3DSolo~"uniview.toggleMainSecondaryPanel"
     * @listens Cortona3DSolo~"uniview.toggleAuxSecondaryPanel"
     * @fires Cortona3DSolo~"uniview.ready"
     * @fires Cortona3DSolo~"uniview.hashChange"
     * @tutorial module-solo-uniview
     * @tutorial module-solo-uniview-secondary
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        // components
        var opt = options.components || {},
            uiProgress = opt.uiProgress || require('components/progress'),
            uiModal = opt.uiModal || require('components/modal'),
            uiLoading = opt.uiLoading || require('components/loading'),
            uiSplitter = opt.uiSplitter || require('components/splitter'),
            uiAlert = opt.uiAlert || require('components/alert'),
            uiCanvasKeymap = opt.uiCanvasKeymap || require('components/rococo/canvas-keymap');

        var supportUrl = 'http://support.cortona3d.com/viewing-publications';

        var extOptions = (solo.uniview && solo.uniview.options) || {},
            extConfig = (solo.uniview && solo.uniview.config) || {},
            exti18n = (solo.uniview && solo.uniview.i18n) || {};

        var systemMessages = solo.expand(require('solo-uniview-system-messages'), extConfig.systemMessages),
            systemLanguage = extConfig.systemLanguage || navigator.language.split('-')[0].toLowerCase();

        systemMessages = systemMessages[systemLanguage] || systemMessages.en;

        if (typeof options.baseUrl === 'undefined') {
            options.baseUrl = 'spec/';
        }

        function uiStackInfo(skin, options, solo) {
            var error = options.error || new Error(),
                pre = skin.create('pre'),
                element = skin.create('.stack-info.hidden',
                    skin.create('.stack-info-button', {
                        onmousedown: function (e) {
                            e.stopPropagation();
                        },
                        onclick: function (e) {
                            element.classList.toggle('hidden');
                        }
                    }),
                    pre
                );
            pre.textContent = error.stack.toString().replace(error.toString(), '').replace(/^[\r\n]+/, '');
            solo.app.ui.css().render({
                '.stack-info': {
                    fontSize: '.9em',
                    '&.hidden': {
                        '& pre': {
                            display: 'none'
                        },
                        '& .stack-info-button:before': {
                            content: '"\u25B7"'
                        },
                    },
                    '& .stack-info-button:before': {
                        content: '"\u25BD"'
                    },
                    '& .stack-info-button': {
                        cursor: 'pointer',
                        minHeight: '1em',
                    }
                }
            });
            return element;
        }

        function isRuntimeLowMemory() {
            return /(Cannot enlarge memory)/i.test((solo.core && solo.core.lastErrorText) || '');
        }

        function errorHandler(error, showDismissButton) {
            var a = systemMessages.msg002.split('%s');
            var supportLink = skin.create('pre',
                a[0],
                skin.create('a', {
                    href: supportUrl,
                    target: '_blank',
                    onmousedown: function (e) {
                        e.stopPropagation();
                    }
                }, 'Viewing Publications'),
                a[1] || ''
            );

            var modal = skin.render(uiModal, {
                hideDismissButton: !showDismissButton,
                title: systemMessages.msg000 || VIEWER_DESCRIPTION || DEFAULT_VIEWER_DESCRIPTION,
                content: skin.create('',
                    skin.create('p.message',
                        skin.create('pre', error.toString()),
                        error.stack ? skin.create(uiStackInfo, {
                            error: error
                        }) : ''
                    ),
                    /(Script error|Could not create canvas)/i.test(error.toString()) ? skin.create('p', skin.create('pre', systemMessages.msg006)) : '',
                    /(Cannot enlarge memory)/i.test(error.message) ? skin.create('p', skin.create('pre', systemMessages.msg005.replace('%s', solo.core.TOTAL_MEMORY / 1024 / 1024))) : '',
                    (/https?:/i.test(location.protocol) || (solo.uniview.config && solo.uniview.config.dismissSystemMessage001)) ? '' : skin.create('p', skin.create('pre', systemMessages.msg001)),
                    skin.create('p', supportLink)
                )
            });
            modal.$el.focus();
            modal.classList.add('error');
        }

        var corePrint, corePrintError, lastWebGLError;

        function hookPrint(handler) {
            var args = Array.prototype.slice.call(arguments, 1),
                text = args.join(' ');

            if (/Could not create canvas/.test(text)) {
                lastWebGLError = text.split(',:')[0];
            } else if (/failed to create WebGL context/.test(text)) {
                solo.dispatch('app.didFailLoadDocument', lastWebGLError);
            }
            handler.apply(this, args);
        }

        function hookWebGLError() {
            if (!solo.core) return;
            corePrint = solo.core.print;
            corePrintError = solo.core.printError;
            solo.core.print = hookPrint.bind(solo.core, solo.core.print);
            solo.core.printErr = hookPrint.bind(solo.core, solo.core.printErr);
        }

        function unhookWebGLError() {
            if (!solo.core) return;
            solo.core.print = corePrint;
            solo.core.printError = corePrintError;
        }

        solo.once('app.onReady', hookWebGLError);
        solo.once('app.didFinishLoadDocument', unhookWebGLError);
        solo.once('app.didFailLoadDocument', unhookWebGLError);

        function hashChangeHandler() {
            switch (window.location.hash.toString()) {
                case '':
                case '#':
                    break;
                default:
                    solo.dispatch('uniview.hashChange', window.location.hash.substring(1));
            }
        }

        skin.$el.setAttribute("role", "application");

        solo.on('uniview.error', errorHandler);

        window.addEventListener('error', function (e) {
            // see https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
            if (/^ResizeObserver loop limit exceeded/.test(e.message)) return true;
            //if (/EvalError:/.test(e.message)) return true;
            //if (/SyntaxError:/.test(e.message)) return true;
            errorHandler(isRuntimeLowMemory() ? new Error(solo.core.lastErrorText) : e.error || e.message, true);
            return true;
        });

        var appClassList = skin.classList,
            interactivityData = {},
            mainViewElement,
            panel,
            loading = skin.create(uiLoading, { i18n: systemMessages.loading });

        loading.emit('start');

        solo.on('uniview.toggleMainPanelOnlyMode', function (mode) {
            if (mode) {
                solo.uniview.settings.ExpandMain = true;
                solo.uniview.settings.ExpandAux = false;
                appClassList.add('cortona3dsolo-main-only');
                appClassList.remove('cortona3dsolo-aux-only');
            } else {
                solo.uniview.settings.ExpandMain = false;
                appClassList.remove('cortona3dsolo-main-only');
            }
            solo.dispatch("core.didChangeLayout");
        });

        solo.on('uniview.toggleAuxPanelOnlyMode', function (mode) {
            if (mode) {
                solo.uniview.settings.ExpandMain = false;
                solo.uniview.settings.ExpandAux = true;
                appClassList.add('cortona3dsolo-aux-only');
                appClassList.remove('cortona3dsolo-main-only');
            } else {
                solo.uniview.settings.ExpandAux = false;
                appClassList.remove('cortona3dsolo-aux-only');
            }
            solo.dispatch("core.didChangeLayout");
        });

        solo.on('uniview.showAllPanels', function () {
            solo.uniview.settings.ExpandMain = false;
            solo.uniview.settings.ExpandAux = false;
            appClassList.remove('cortona3dsolo-aux-only');
            appClassList.remove('cortona3dsolo-main-only');
            solo.dispatch("core.didChangeLayout");
        });

        solo.on('uniview.toggleAuxSecondaryPanel', function (value) {
            var auxSplitterNode = document.querySelector('.aux-splitter'),
                auxSecondaryPanel = document.querySelector('.aux-secondary.panel');
            if (value) {
                auxSplitterNode.classList.remove('disabled');
                skin.show(auxSecondaryPanel);
                skin.show(auxSplitterNode);
            } else {
                auxSplitterNode.classList.add('disabled');
                skin.hide(auxSecondaryPanel, true);
                skin.hide(auxSplitterNode, true);
            }
            solo.dispatch('core.didChangeLayout');
        });

        solo.on('uniview.toggleMainSecondaryPanel', function (value) {
            var mainSplitterNode = document.querySelector('.main-splitter'),
                mainSecondaryPanel = document.querySelector('.main-secondary.panel');
            if (value) {
                mainSplitterNode.classList.remove('disabled');
                skin.show(mainSecondaryPanel);
                skin.show(mainSplitterNode);
            } else {
                mainSplitterNode.classList.add('disabled');
                skin.hide(mainSecondaryPanel, true);
                skin.hide(mainSplitterNode, true);
            }
            solo.dispatch('core.didChangeLayout');
        });

        function transformOld2DOnlyCompanion(data) {
            if (data.type === 'ipc' && +data.options.IllustrationType === 2) {
                var srcVrml = data.interactivity.json.$('ipc/figure/media')[0].$attr('src');
                if (srcVrml) {
                    return solo.app.util.loadResource(options.src, 'text/xml')
                        .then(function (xhr) {
                            var re = new RegExp('src="' + srcVrml + '"', ''),
                                syntax = xhr.responseText.replace(re, '').replace(/src="([^"]*)"/g, function (s, src) {
                                    return 'src="' + solo.app.util.toUrl(src, options.src) + '"';

                                });
                            options.src = URL.createObjectURL(new Blob([syntax], {
                                type: "text/xml"
                            }));
                            return data;
                        });
                }
            }
            return data;
        }

        /*
         * skin
         *      header.solo-uniview-header  // panel.header
         *      main.solo-uniview-content   // panel.content
         *          .main.panel             // panel.main
         *          .aux.panel              // panel.aux
         *      footer.solo-uniview-footer  // panel.footer
         */

        panel = {
            header: skin.create('header.solo-uniview-header'),
            footer: skin.create('footer.solo-uniview-footer'),
            content: skin.create('main.solo-uniview-content'),
            main: skin.div('.main.panel'),
            aux: skin.div('.aux.panel'),
            view: skin.div('.panel-view'),
            mainSecondary: skin.div('.main-secondary.panel'),
            mainContent: skin.div('.main-content.panel'),
            auxSecondary: skin.div('.aux-secondary.panel'),
            auxContent: skin.div('.aux-content.panel')
        };

        solo.skin.create('main', panel.mainContent).append(panel.view);
        solo.skin.create('aux', panel.auxContent);
        solo.skin.create('view', panel.view);
        solo.skin.create('aux-secondary', panel.auxSecondary);
        solo.skin.create('main-secondary', panel.mainSecondary);

        skin.hide(panel.auxSecondary, true);
        skin.hide(panel.mainSecondary, true);

        var splitter = skin.create(uiSplitter),
            auxSplitter = skin.create(uiSplitter),
            mainSplitter = skin.create(uiSplitter);

        auxSplitter.classList.add('aux-splitter');
        auxSplitter.classList.add('disabled');
        skin.hide(auxSplitter.$el, true);

        mainSplitter.classList.add('main-splitter');
        mainSplitter.classList.add('disabled');
        skin.hide(mainSplitter.$el, true);

        solo.on('uniview.ready', function (uniview) {
            if (uniview.options.disableSplitter) {
                splitter.classList.add('disabled');
                auxSplitter.classList.add('disabled');
                mainSplitter.classList.add('disabled');
            }
            if (uniview.with3D) {
                var t;
                function resize() {
                    clearTimeout(t);
                    t = setTimeout(function () {
                        solo.dispatch("core.didChangeLayout");
                    }, 0);
                }
                splitter.on('moved', resize);
                auxSplitter.on('moved', resize);
                mainSplitter.on('moved', resize);
            }
        });

        // flex-direction: column
        panel.aux.append(
            panel.auxContent,
            auxSplitter.$el,
            panel.auxSecondary
        );

        panel.main.append(
            panel.mainContent,
            mainSplitter.$el,
            panel.mainSecondary
        );

        // flex-direction: row
        panel.content.append(
            panel.main,
            splitter.$el,
            panel.aux,
            skin.create(uiProgress).$el
        );

        // flex-direction: column
        skin.append(
            panel.header,
            panel.content,
            panel.footer
        );

        // load appropriate skin
        var src,
            promise = Promise.resolve(solo.version)
            .then(function (version) {
                function verToFloat(version) {
                    return parseFloat(version.split('.').slice(0, 2).join('.'));
                }
                var soloRequiredVersion = options.soloRequiredVersion || '2.4.0';
                if (!version || verToFloat(version) < verToFloat(soloRequiredVersion)) {
                    throw new Error(systemMessages.msg003.replace(/%s/, soloRequiredVersion));
                }
                return src = solo.app.util.toUrl(options.src);
            })
            .then(function (src) {
                var initPromises = [
                    solo.use('Cortona3DSoloTouch')
                ];

                if (/\.(svg|jpe?g|png|tiff?)/i.test(src) || options.treatSrcAsImageFile) {
                    // single 2D graphics
                    mainViewElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    initPromises.push(solo.use('drawing', solo.expand({}, options, {
                        element: mainViewElement
                    })));
                } else {
                    var isCompanionUrl = /\.interactivity\.xml/i.test(src) || options.treatSrcAsCompanionFile;
                    return (src && isCompanionUrl ? solo.app.loadCompanionFile(src) : Promise.reject())
                        .catch(function () {
                            // try load src as .solo package
                            return {
                                options: {
                                    IllustrationType: 0,
                                    TotalMemory: options.totalMemory || 128
                                }
                            };
                        })
                        .then(function (data) {
                            return transformOld2DOnlyCompanion(data);
                        })
                        .then(function (data) {
                            // test text specification
                            if (data.type === 'procedure' && !data.interactivity.json.$text('SimulationInteractivity/SimulationInformation/FileName')) {
                                data.options.IllustrationType = 2;
                            }

                            interactivityData = data;
                            var illustrationType = (data.type === 'ipc') ? 0 : +data.options.IllustrationType;

                            switch (illustrationType || 0) {
                                case 0:
                                // 2d 3d
                                case 1:
                                    // 3d
                                    if (isIE) throw new Error(systemMessages.msg008);
                                    if (data.options.TotalMemory) {
                                        if (data.options.TotalMemory > (options.totalMemory || 0)) {
                                            options.totalMemory = +data.options.TotalMemory;
                                        }
                                    }
                                    mainViewElement = skin.create('canvas');
                                    initPromises.push(solo.use("drawing", solo.expand({}, options, {
                                        src: ''
                                    })));
                                    initPromises.push(solo.use('core', solo.expand({}, options, {
                                        element: mainViewElement,
                                        features: (options.disableDoubleClickToFitObject ? 0 : solo.app.ENABLE_NAVIGATION_FIT_TO_OBJECT) |
                                            ((!options.useVertexArrayObjectOES && typeof (window.chrome) === 'object') ? solo.app.DISABLE_VERTEX_ARRAY_OBJECT_OES : 0) |
                                            (options.useDiscardableGeometryData ? 0 : solo.app.DISABLE_DISCARDABLE_GEOMETRY_DATA) |
                                            (options.useGLES2 ? 0 : solo.app.ENABLE_GLES3) |
                                            (options.useAntialiasingGLES3 ? 0 : solo.app.DISABLE_ANTIALIASING_GLES3) |
                                            (options.features || 0)
                                    })));
                                    break;
                                case 2:
                                    // 2d
                                    mainViewElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                    initPromises.push(solo.use('drawing', solo.expand({}, options, {
                                        element: mainViewElement,
                                        src: ''
                                    })));
                                    if (data.type) {
                                        var add = {
                                            modelInfo: data
                                        };
                                        add[data.type] = {
                                            interactivity: data.interactivity
                                        };
                                        solo.expand(solo.app, add);
                                    }
                            }
                            return initPromises;
                        });
                }

                return initPromises;
            })
            .then(function (initPromises) {
                panel.view.append(mainViewElement);
                initPromises.push(solo.app.initialize());

                return Promise.all(initPromises);
            })
            .catch(function (e) {
                throw new Error('Failed to load "' + src + '" (' + e + ')');
            })
            .then(function (values) {
                loading.emit('init');

                var doc = solo.expand(interactivityData, values[values.length - 1]),
                    ixml = solo.app[doc.type] && solo.app[doc.type].interactivity,
                    modelOptions = (ixml && ixml.getOptions()) || doc.options || {},
                    specId = (doc.specificationName || modelOptions.SpecID || '').trim(),
                    type = doc.type,
                    specMap = extOptions.specMap || {},
                    baseType = ('uniview-' + type).toLowerCase(),
                    altType = options.altType || baseType,
                    pubType = specId.toLowerCase(),
                    appType = options.appType || (specId ? specMap[specId] || (options.baseUrl + pubType) : altType),
                    lang = (modelOptions.SpecLang || '').toLowerCase();

                if (type === 'procedure') {
                    if (specId) {
                        altType = 'uniview-procedure-with-document';
                    }
                    if (ixml && !ixml.json.$text('SimulationInteractivity/SimulationInformation/FileName')) {
                        if (solo.core) {
                            solo.once('app.firstFrameDidArrive', function () {
                                solo.app.ui.showCanvas(false);
                            });
                        }
                    }
                }

                skin.classList.add(baseType);

                /**
                 * @global 
                 * @namespace Cortona3DSolo
                 */

                /**
                 * The namespace represents the viewer application interface.
                 * 
                 * @namespace Cortona3DSolo.uniview
                 * @memberof Cortona3DSolo
                 * @prop {object} config The configuration object of a viewer application.
                 * @prop {string} config.appType The name of a customization module for the loaded publication data.
                 * @prop {string} config.altType the name of an alternate customization module for the loaded publication data.
                 * @prop {string} config.lang The language code of the used internationalization.
                 * @prop {string} config.src The URL of the loaded publication data.
                 * @prop {object} customization The object holds information of the used customization module.
                 * @prop {string} customization.module The name of the customization module 
                 * @prop {string} customization.description The description of the customization module 
                 * @prop {string} customization.version The version of the customization module
                 * @prop {DocumentInfo} doc An information object of the loaded publication data.
                 * @prop {CSSObject} css The object contains CSS rules of the loaded customization.
                 * @prop {object} i18n An object contains internationalizations strings.
                 * @prop {object} ixml An object contains `interactivity` namespace depends of the loaded publication data.
                 * @prop {KeyValuePairs} metadata The object contains project metadata of the loaded publication data.
                 * @prop {KeyValuePairs} options The object contains publish options of the loaded publication data.
                 * @prop {KeyValuePairs} settings The object contains current viewer settings.
                 * @prop {string} description The description of the viewer application
                 * @prop {string} version The version of the viewer application
                 * @prop {boolean} with3D The flag determines whether the loaded publication data has a 3D model.
                 */
                solo.uniview = {
                    config: solo.expand({
                        lang: lang || "en"
                    },
                        extConfig, {
                        appType: appType,
                        altType: altType,
                        pubType: pubType,
                        src: ""
                    },
                        options
                    ),
                    i18n: exti18n,
                    with3D: type !== 'drawing' && (+modelOptions.IllustrationType || 0) < 2,
                    doc: doc,
                    css: extConfig.css || skin.css(),
                    options: solo.expand(modelOptions, extOptions),
                    metadata: (ixml && ixml.getProjectMetadata()) || doc.metadata || {},
                    settings: {},
                    skin: skin,
                    ixml: ixml || doc.interactivity,
                    version: VIEWER_VERSION || '(draft)',
                    description: VIEWER_DESCRIPTION || DEFAULT_VIEWER_DESCRIPTION,
                    customization: {
                        module: appType,
                        description: appType,
                        version: ""
                    }
                };

                if (type === 'procedure') {
                    if (solo.uniview.ixml && solo.uniview.ixml.json) {
                        if (!solo.uniview.ixml.json.$text('SimulationInteractivity/SimulationInformation/FileName')) {
                            solo.uniview.with3D = false;
                        }
                    }
                }

                if (typeof solo.uniview.config.src !== 'string') {
                    solo.uniview.config.src = '' + (solo.uniview.config.src || '');
                }

                var packageName = solo.uniview.config.src.substring(solo.uniview.config.src.lastIndexOf('/') + 1);
                document.title = (solo.uniview.metadata.TITLE ? solo.uniview.metadata.TITLE : packageName) + ' - ' + solo.uniview.description;

                // sx --> en
                if (solo.uniview.metadata.LANG === 'sx') {
                    solo.uniview.metadata.LANG = 'en';
                }

                // async load css + spec ui component
                //requirejs(["css!" + appType + ".css"]);

                if (solo.uniview.options.disableStandardLocaleFile) {
                    return {};
                }

                return solo.app.util.requirePromise("json!static/i18n/en/solo-uniview.json")
                    .catch(function () { return {}; })
                    .then(function (i18n_en) {
                        return solo.uniview.config.lang === 'en' ? i18n_en : solo.app.util.requirePromise("json!static/i18n/" + solo.uniview.config.lang + "/solo-uniview.json")
                            .catch(function () { return {}; })
                            .then(function (i18n_lang) {
                                return solo.expand(i18n_en, i18n_lang);
                            });
                    });
            })
            .then(function (i18n) {
                if (!solo.uniview.options.enableCustomLocaleFile) {
                    return solo.expand({}, i18n, solo.uniview.i18n);
                }

                var pathnameWithoutJS = solo.uniview.customization.module.replace(/\.js$/i, '');

                // load spec 18n
                return solo.app.util.requirePromise('json!' + pathnameWithoutJS + '-locale-en.json')
                    .catch(function () { return {}; })
                    .then(function (i18n_en) {
                        return solo.uniview.config.lang === 'en' ? i18n_en : solo.app.util.requirePromise('json!' + pathnameWithoutJS + '-locale-' + solo.uniview.config.lang + '.json')
                            .catch(function () { return {}; })
                            .then(function (i18n_lang) {
                                return solo.expand(i18n_en, i18n_lang);
                            });
                    })
                    .then(function (i18nSpec) {
                        return solo.expand({}, i18n, i18nSpec, solo.uniview.i18n);
                    });
            })
            .then(function (i18n) {
                solo.uniview.i18n = i18n;

                // processing layout publish options
                var frame3DSize = +solo.uniview.options['3DFrameSize'] || 50;

                if (frame3DSize === 100) {
                    frame3DSize = 50;
                }

                solo.uniview.css.render({
                    ".main.panel": {
                        flexBasis: frame3DSize + '%'
                    },
                    ".aux.panel": {
                        flexBasis: (100 - frame3DSize) + '%'
                    },
                });

                var frame3DPos = solo.uniview.options['3DFramePosition'] || 'Left';

                if (frame3DPos === 'Top' || frame3DPos === 'Bottom') {
                    skin.classList.add('layout-column');
                }

                if (frame3DPos === 'Right' || frame3DPos === 'Bottom') {
                    skin.classList.add('layout-reverse');
                }

                var helpBusy = false;

                var appOptions = solo.expand({
                    panel: panel,
                    singleDisplayMode: !!+solo.uniview.options.IllustrationType,
                    hideNavigationSchemeSetting: true,
                    helpAction: function () {
                        if (helpBusy) return;
                        helpBusy = true;

                        var getStaticHelpUrl = function (locale) {
                            return requirejs.toUrl(
                                'static/help/' + solo.uniview.doc.type + '/' + locale + '/help.html'
                            );
                        },
                            url = solo.uniview.options.helpUrl || getStaticHelpUrl(solo.uniview.config.lang),
                            content = solo.uniview.options.helpContent;
                        Promise.resolve(content)
                            .then(function (srcdoc) {
                                if (srcdoc) return srcdoc;
                                if (!url) return;
                                return solo.app.util.loadResource(url, 'text/html')
                                    .catch(function () {
                                        if (solo.uniview.config.lang === 'en') return;
                                        url = getStaticHelpUrl('en');
                                        return solo.app.util.loadResource(url, 'text/html');
                                    })
                                    .then(function (xhr) {
                                        if (!xhr) return;
                                        if (xhr.response) return '<base href="' + url + '">' + xhr.response;
                                        var origin = new URL(url, location).origin;
                                        solo.dispatch('uniview.error', new Error(systemMessages.msg009.replace('%s', '<a href="' + origin + '" target="_blank">' + origin + '</a>')), true);
                                    });
                            })
                            .then(function (srcdoc) {
                                if (!srcdoc) return;
                                var modal = skin.render(uiModal, {
                                    enableCloseButton: true,
                                    i18n: {
                                        close: (solo.uniview.i18n.ui || {}).close || 'Close'
                                    },
                                    title: (solo.uniview.i18n.ui || {}).help,
                                    content: skin.create('iframe', {
                                        srcdoc: srcdoc,
                                        onload: function () {
                                            var iframeDocument = this.contentDocument;
                                            if (!iframeDocument.body.children.length) {
                                                // Edge?
                                                iframeDocument.open('text/html', 'replace');
                                                iframeDocument.write(srcdoc);
                                                iframeDocument.close();
                                            } else {
                                                this.contentWindow.addEventListener('keydown', function (e) {
                                                    if (e.keyCode === 27 || e.keyCode === 13) {
                                                        skin.emit('modal.close');
                                                        e.preventDefault();
                                                    }
                                                });
                                                this.contentWindow.focus();
                                            }
                                        }
                                    })
                                });
                                modal.classList.add('help');
                            })
                            .catch(console.error.bind(console))
                            .finally(function () {
                                helpBusy = false;
                            });
                    }
                }, solo.uniview.options);

                var reLoadingError = /loading/i,
                    customizationInfo = solo.uniview.customization;

                return skin.use(options.factory || customizationInfo.module, appOptions)
                    .then(function () {
                        if (typeof options.factory === 'string') {
                            customizationInfo.description = options.factory;
                        } else if (typeof options.factory === 'function') {
                            customizationInfo.description = '';
                        }
                    })
                    .catch(function (error) {
                        if (reLoadingError.test(error.message) && solo.uniview.options.PublicPath) {
                            console.log('Try to use PublicPath "' + solo.uniview.options.PublicPath + '"');

                            customizationInfo.module = solo.uniview.options.PublicPath + 'uniview/' + options.baseUrl + solo.uniview.config.pubType + '.js';
                            customizationInfo.description = customizationInfo.module;

                            return skin.use(customizationInfo.module, appOptions);
                        }
                        return Promise.reject(error);
                    })
                    .catch(function (error) {
                        if (reLoadingError.test(error.message) && solo.uniview.doc.bundleURL) {
                            console.log('Try to use module from bundle');

                            var url = solo.app.util.createResourceURL(solo.uniview.config.pubType + '.js');
                            if (url) {
                                customizationInfo.module = solo.uniview.config.pubType;
                                customizationInfo.description = customizationInfo.module;

                                return solo.app.util.loadResource(url, 'application/javascript')
                                    .then(function (xhr) {
                                        return skin.use((new Function('define', 'return 0,' + xhr.response))(function (f) { return f(); }), appOptions);
                                    })
                            }
                        }
                        return Promise.reject(error);
                    })
                    .catch(function (error) {
                        if (reLoadingError.test(error.message) && typeof solo.uniview.options.ReferenceSpecID === 'string') {
                            console.log('Try to use ReferenceSpecID "' + solo.uniview.options.ReferenceSpecID + '"');

                            customizationInfo.module = options.baseUrl + solo.uniview.options.ReferenceSpecID.toLowerCase();
                            customizationInfo.description = customizationInfo.module + ' (*)';

                            return skin.use(customizationInfo.module, appOptions);
                        }
                        return Promise.reject(error);
                    })
                    .catch(function (error) {
                        if (reLoadingError.test(error.message) && !options.disableAlternateSkin) {
                            console.log('Try to use alternate skin "' + solo.uniview.config.altType + '"');

                            customizationInfo.module = solo.uniview.config.altType;
                            customizationInfo.description = customizationInfo.module + ' (*)';

                            return skin.use(customizationInfo.module, appOptions);
                        }
                        return Promise.reject(error);
                    });
            })
            .then(function () {
                if (isRuntimeLowMemory()) throw new Error(solo.core.lastErrorText);
                if (isIE) {
                    if (!solo.uniview.options.dismissSystemMessage007) {
                        skin.render(uiAlert, {
                            message: systemMessages.msg007
                        });
                    }
                }
            })
            .then(function () {
                if (+solo.uniview.options['3DFrameSize'] === 100) solo.dispatch('uniview.toggleMainPanelOnlyMode', true);
                else if (+solo.uniview.options['3DFrameSize'] === 0) solo.dispatch('uniview.toggleAuxPanelOnlyMode', true);

                if (solo.uniview.options.CustomCSSRules) {
                    solo.app.ui.css().render().style.innerHTML = solo.uniview.options.CustomCSSRules;
                }

                for (var key in solo.uniview.settings) {
                    if (typeof solo.uniview.options['Initial' + key] !== 'undefined') {
                        solo.uniview.settings[key] = solo.uniview.options['Initial' + key];
                    }
                    if (typeof solo.uniview.options['Hide' + key] !== 'undefined') {
                        solo.dispatch('uniview.settings.hide' + key, solo.uniview.options['Hide' + key]);
                    }
                    if (typeof solo.uniview.options['Disable' + key] !== 'undefined') {
                        solo.dispatch('uniview.settings.disable' + key, solo.uniview.options['Disable' + key]);
                    }
                }

                skin.create(uiCanvasKeymap, options);
                if (!PRODUCTION) console.info('*** LOADED ***');
                loading.emit('success');
                solo.dispatch("core.didChangeLayout");
                solo.dispatch('uniview.ready', solo.uniview);
                if (!options.disableHashChangeHandler) {
                    window.addEventListener('hashchange', hashChangeHandler);
                    hashChangeHandler();
                }
                return solo.uniview;
            })
            .catch(function (error) {
                if (!PRODUCTION) console.info('*** FAILED ***');
                loading.emit('failed');
                var errorObject = typeof error === 'string' ? new Error(error) : error || new Error('Unknown error');
                if (errorObject.target !== window && !(isRuntimeLowMemory())) {
                    solo.dispatch('uniview.error', errorObject, true);
                }
                throw errorObject;
            });

        return promise;
    };
});

/**
 * The event is fired after the customization module is fully loaded and initialized.
 * @event Cortona3DSolo~"uniview.ready"
 * @type {Cortona3DSolo.uniview}
 */
/**
 * The event is fired when a window's hash changes. 
 * @event Cortona3DSolo~"uniview.hashChange"
 * @type {arguments}
 * @prop {string} hashContent The fragment identifier of the URL, i.e. a value of the `location.hash` without `'#'` character.
 */
/**
 * It is used to show a modal panel with an error message.
 * @event Cortona3DSolo~"uniview.error"
 * @type {arguments}
 * @prop {Error} error
 * @prop {boolean} showDismissButton
 */
/**
 * It is used to show only the `main` panel of the application.
 * @event Cortona3DSolo~"uniview.toggleMainPanelOnlyMode"
 * @type {boolean}
 */
/**
 * It is used to show only the `aux` panel of the application.
 * @event Cortona3DSolo~"uniview.toggleAuxPanelOnlyMode"
 * @type {boolean}
 */
/**
 * It is used to show both the `main` and `aux` panels of the application.
 * @event Cortona3DSolo~"uniview.showAllPanels"
 */
/**
 * It is used to show the secondary `main` panel of the application.
 * @event Cortona3DSolo~"uniview.toggleMainSecondaryPanel"
 * @type {boolean}
 */
/**
 * It is used to show the secondary `aux` panel of the application.
 * @event Cortona3DSolo~"uniview.toggleAuxSecondaryPanel"
 * @type {boolean}
 */

/**
 * A function that creates a new instance of a user interface component.
 * 
 * @param {UISkinController} skin
 * @param {object} options
 * @param {Cortona3DSolo} solo
 * @typedef {function} factory
 * @this UISkinComponent
 * @example
function (skin, options, solo) {
    return this.exports(skin.create('#message', options.message | ''));
}
 */