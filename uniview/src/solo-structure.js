/**
 * :src
 * :totalMemory
 * :disableAlternateSkin
 * :features
 * :baseUrl
 * :factory
 * 
 * :components.uiProgress
 * :components.uiLoading
 * 
 * =@uniview.error(error, showDismissButton)
 * =@uniview.showAllPanels()
 */

define(function (require, exports, module) {
    //style
    require('css!./main.css');
    require('css!./solo-structure.css');

    // build vars
    var PRODUCTION,
        VIEWER_VERSION,
        VIEWER_DESCRIPTION;

    window.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    window.addEventListener('mousedown', function (e) {
        if (e.shiftKey & 1) {
            e.preventDefault();
        }
    });

    module.exports = function (skin, options, solo) {

        // components
        var opt = options.components || {},
            uiProgress = opt.uiProgress || require('components/progress'),
            uiModal = opt.uiModal || require('components/modal'),
            uiLoading = opt.uiLoading || require('components/loading');

        var extOptions = (solo.uniview && solo.uniview.options) || {},
            extConfig = (solo.uniview && solo.uniview.config) || {},
            exti18n = (solo.uniview && solo.uniview.i18n) || {};

        function errorHandler(event, showDismissButton) {
            var modal = skin.create(uiModal, {
                hideDismissButton: !showDismissButton,
                title: "Error",
                content: skin.p('', skin.create('pre', '', event.message))
            });
            modal.classList.add('error');
            skin.append(modal);
        }

        skin.element.setAttribute("role", "application");

        solo.on('uniview.error', function (error, showDismissButton) {
            errorHandler(error, showDismissButton);
        });

        window.addEventListener('error', errorHandler);

        skin.render(uiProgress);

        var appClassList = skin.classList,
            interactivityData = {},
            mainViewElement,
            panel,
            loading = skin.create(uiLoading);

        loading.emit('init');

        solo.on('uniview.showAllPanels', function () {
            appClassList.remove('cortona3dsolo-structure-only');
            appClassList.remove('cortona3dsolo-frame-only');
        });

        solo.on('uniview.toggleStructurePanelOnlyMode', function (mode) {
            if (mode) {
                appClassList.add('cortona3dsolo-structure-only');
                appClassList.remove('cortona3dsolo-iframe-only');
            } else {
                appClassList.remove('cortona3dsolo-structure-only');
            }
        });

        solo.on('uniview.toggleIFramePanelOnlyMode', function (mode) {
            if (mode) {
                appClassList.add('cortona3dsolo-iframe-only');
                appClassList.remove('cortona3dsolo-structure-only');
            } else {
                appClassList.remove('cortona3dsolo-iframe-only');
            }
        });

        // load appropriate skin
        var promise = Promise.resolve(solo.version)
            .then(function (version) {
                function verToFloat(version) {
                    return parseFloat(version.split('.').slice(0, 2).join('.'));
                }
                var soloRequiredVersion = extConfig.soloRequiredVersion || '1.6.0';
                if (!version || verToFloat(version) < verToFloat(soloRequiredVersion)) {
                    return Promise.reject(new Error('Incompatible version of the Cortona3D Solo library. The version must be ' + soloRequiredVersion + ' and higher.'));
                }
                return options.src;
            })
            .then(function (src) {
                return (src ? solo.app.loadCompanionFile(src) : Promise.reject());
            })
            .then(function (data) {
                /**
                 * skin
                 *      header.solo-uniview-header  // panel.header
                 *      main.solo-uniview-content   // panel.content
                 *          .structure.panel          // panel.structure
                 *          .frame.panel              // panel.frame
                 *      footer.solo-uniview-footer  // panel.footer
                 */

                panel = {
                    header: skin.create('header.solo-uniview-header'),
                    footer: skin.create('footer.solo-uniview-footer'),
                    content: skin.create('main.solo-uniview-content'),
                    structure: skin.div('.structure.panel'),
                    iframe: skin.div('.iframe.panel'),
                };

                // flex-direction: row
                panel.content.append(
                    panel.structure,
                    panel.iframe
                );

                // flex-direction: column
                skin.append(
                    panel.header,
                    panel.content,
                    panel.footer
                );

                return data;
            })
            .then(function (data) {

                solo.expand(options, {
                    structureUrl: solo.app.util.toUrl(options.src),
                    panel: panel,
                    structure: data
                });

                var pub = {};
                data.interactivity.json.$('structure/Options/Value').forEach(function (item) {
                    var pubName = item.$attr('name');
                    var pubValue = item.$text();
                    pub[pubName] = pubValue;
                });

                solo.expand(options, pub);

                if (solo.uniview.options.disableStandardLocaleFile) {
                    return {};
                }

                return solo.app.util.requirePromise("json!static/i18n/" + solo.uniview.config.lang + "/solo-uniview.json")
                    .catch(function () {
                        if (solo.uniview.config.lang === 'en') return {};
                        return solo.app.util.requirePromise("json!static/i18n/en/solo-uniview.json")
                            .catch(function () {
                                return {};
                            });
                    });
            })
            .then(function (i18n) {
                if (!solo.uniview.options.enableCustomLocaleFile) {
                    return solo.expand({}, i18n, solo.uniview.i18n);
                }

                var pathnameWithoutJS = solo.uniview.customization.module.replace(/\.js$/i, '');

                // load spec 18n
                return solo.app.util.requirePromise('json!' + pathnameWithoutJS + '-locale-' + solo.uniview.config.lang + '.json')
                    .then(function (i18nSpec) {
                        return solo.expand({}, i18n, i18nSpec, solo.uniview.i18n);
                    })
                    .catch(function () {
                        if (solo.uniview.config.lang === 'en') return solo.expand({}, i18n, solo.uniview.i18n);
                        return solo.app.util.requirePromise('json!' + pathnameWithoutJS + '-locale-en.json')
                            .then(function (i18nSpec) {
                                return solo.expand({}, i18n, i18nSpec, solo.uniview.i18n);
                            })
                            .catch(function () {
                                return solo.expand({}, i18n, solo.uniview.i18n);
                            });
                    });
            })
            .then(function (i18n) {
                solo.uniview.i18n = i18n;
                skin.render(options.factory || require('uniview-structure'), options);
            })
            .then(function () {
                if (!PRODUCTION)
                    console.info('*** LOADED ***');
                loading.emit('success');
                solo.dispatch('uniview.ready', solo.uniview);
                return solo.uniview;
            }, function (error) {
                if (!PRODUCTION)
                    console.info('*** FAILED ***');
                loading.emit('failed');
                var errorObject = typeof error === 'string' ? new Error(error) : error || new Error('Unknown exception');
                errorHandler(errorObject);
                return Promise.reject(errorObject);
            });

        return promise;
    };
});