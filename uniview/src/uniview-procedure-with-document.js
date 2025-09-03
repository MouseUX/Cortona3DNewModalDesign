/**
 * A function module to display the RapidManual interactive procedure that contains the XML document of procedure steps.
 * 
 * This is the default customization module to display any RapidManual interactive procedure with the document.
 * 
 * @module uniview-procedure-with-document
 * @requires module:addons/procedure
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');
    require('css!uniview-procedure-with-document.css');

    /**
     * A factory function.
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiApplyPublishOptions The factory function of the component used to apply common publish options
     * @param {factory} options.components.uiProcedureApplyPublishOptions The factory function of the component used to apply the procedure publish options
     * @param {factory} options.components.uiProcedureContextMenu The factory function of the component used to display the context menu
     * @param {factory} options.components.uiProcedureCommentPanel The factory function of the component used to display the comment pane
     * @param {factory} options.components.uiProcedureToolbar The factory function of the component used to display the toolbar for the procedure
     * @param {factory} options.components.uiProcedureMessageModal The factory function of the component used to display the message modal pane
     * @param {factory} options.components.uiProcedureSettingsPanel The factory function of the component used to display the procedure settings pane
     * @param {factory} options.components.uiProcedureToolbarPartSelection The factory function of the component used to display the toolbar to control the selected parts
     * @param {factory} options.components.uiToolbarSceneNavigation The factory function of the component used to display the toolbar that contains the navigation buttons
     * @param {factory} options.components.uiProcedureToolbarDrawing The factory function of the component used to display the toolbar for the drawing
     * @param {factory} options.components.uiMultimedia The factory function of the component used to display the attached multimedia content
     * @param {factory} options.components.uiDocument A factory function of the {@link module:components/doc components/doc} component that is used to display a pre-rendered document
     * @param {factory} options.components.uiDocumentFilter The factory function of the component used to display the filter pane for the document
     * @param {factory} options.components.uiDocumentToolbar The factory function of the component used to display the toolbar for the document
     * @param {factory} options.components.uiProcedureKeymap The factory function of the component to control the application using the keyboard
     * @param {factory} options.components.uiApplyProcedureHashParams The factory function of the component used to apply onHashChange handler 
     * @param {factory} options.components.uiExternal3DPanel The factory function of the component used to display selected objects in an separate 3d window
     * @param {factory} options.components.uiSecondaryFigurePanel The factory function of the component used to display the secondary figure panel
     * @param {boolean} options.useTitleFor3DLinkButton Use the tooltip for the 3D step activation button
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"uniview.showAllPanels"
     * @fires Cortona3DSolo~"uniview.toggleAuxPanelOnlyMode"
     * @fires Cortona3DSolo~"uniview.linkMedia"
     * @listens Cortona3DSolo~"app.procedure.didDrawingDisplayMode"
     * @listens Cortona3DSolo~"uniview.doc.didLoadComplete"
     * @tutorial module-uniview-procedure-with-document
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        require('addons/procedure');

        var i18n = solo.uniview.i18n['procedure-with-document'] || {};

        var opt = options.components || {},
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),
            uiProcedureApplyPublishOptions = opt.uiProcedureApplyPublishOptions || require('spec/lib/apply-pub-options-procedure'),
            uiProcedureContextMenu = opt.uiProcedureContextMenu || require('components/rococo/solo-skin-procedure-context-menu'),
            uiProcedureCommentPanel = opt.uiProcedureCommentPanel || require('components/rococo/solo-skin-procedure-comment-panel'),
            uiProcedureToolbar = opt.uiProcedureToolbar || require('components/rococo/solo-skin-procedure-toolbar'),
            uiProcedureMessageModal = opt.uiProcedureMessageModal || require('components/rococo/solo-skin-procedure-message-modal'),
            uiProcedureSettingsPanel = opt.uiProcedureSettingsPanel || require('components/rococo/solo-skin-procedure-settings-panel'),
            uiProcedureToolbarDrawing = opt.uiProcedureToolbarDrawing || require('components/rococo/solo-skin-toolbar-procedure-drawing'),
            uiProcedureToolbarPartSelection = opt.uiProcedureToolbarPartSelection || require('components/rococo/solo-skin-procedure-toolbar-part-selection'),
            uiMultimedia = opt.uiMultimedia || require('components/rococo/solo-skin-multimedia'),
            uiToolbarSceneNavigation = opt.uiToolbarSceneNavigation || require('components/rococo/solo-skin-toolbar-scene-navigation'),
            uiProcedureKeymap = opt.uiProcedureKeymap || require('components/rococo/solo-skin-procedure-keymap'),
            uiDocument = opt.uiDocument || require('components/doc'),
            uiDocumentFilter = opt.uiDocumentFilter || require('components/rococo/solo-skin-document-filter'),
            uiDocumentToolbar = opt.uiDocumentToolbar || require('components/rococo/solo-skin-toolbar-document'),
            uiApplyProcedureHashParams = opt.uiApplyProcedureHashParams || require('spec/lib/apply-procedure-hash-params'),
            uiExternal3DPanel = opt.uiExternal3DPanel || require('components/rococo/solo-skin-external-3d-panel'),
            uiSecondaryFigurePanel = opt.uiSecondaryFigurePanel,
            uiSecondaryFigureToolbar = opt.uiSecondaryFigureToolbar || require('components/rococo/solo-skin-toolbar-secondary-figure');

        var fig = solo.skin.get('main'),
            doc = solo.skin.get('aux'),
            view = solo.skin.get('view'),
            auxview = solo.skin.get('aux-secondary') || solo.skin.get('auxview'),
            mainview = solo.skin.get('main-secondary');

        var getOptionsFromDataset = require('lib/get-options-from-dataset');

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            if (drawingMode) {
                view.classList.add('display-mode-2d');
            } else {
                view.classList.remove('display-mode-2d');
            }
        });

        solo.once('uniview.doc.didLoadComplete', function (element) {
            var isDocumentEmpty = element.children.length === 0;
            if (isDocumentEmpty) {
                solo.dispatch('uniview.toggleMainPanelOnlyMode', true);
                skin.classList.add('uniview-empty-document');
            }
        });

        if (!solo.uniview.options.UseProcedure3DButton) {
            solo.once('uniview.doc.didLoadComplete', function (element) {
                var procId = solo.uniview.ixml.getProcedureId();
                element.querySelectorAll('.link3d').forEach(function (el) {
                    if (el.dataset.key === procId) {
                        el.classList.remove('link3d');
                    }
                });
            });
        }

        skin.create(uiApplyPublishOptions, options);

        if (solo.uniview.with3D) {
            solo.once('uniview.ready', function () {
                solo.app.procedure.requestPlayerState();
            });

            // 3D procedure layout
            view.render([
                uiProcedureCommentPanel,
                {
                    component: uiProcedureSettingsPanel,
                    options: {
                        enableAutoHide: true,
                        hideSelectionModeSetting: !solo.uniview.options.Enable3DPartSelection,
                        hideOutlineHoveredObjectsSetting: !solo.uniview.options.Enable3DPartSelection,
                        auxSettings: {
                            name: "Comment",
                            label: i18n.labelShowComments
                        }
                    }
                }

            ], options);

            fig.render([
                uiToolbarSceneNavigation,
                {
                    component: solo.uniview.options.Enable3DPartSelection ? uiProcedureToolbarPartSelection : function () { },
                    options: {
                        selectByDocID: options.link3DObjectWithHotspot ? true : false
                    }
                },
                {
                    component: uiProcedureToolbar,
                    options: {
                        disableFastForward: solo.uniview.options.ShowPrevNextButtons === false,
                        disableSeekControl: solo.uniview.options.ShowSmoothControl === false,
                        disableDurationView: solo.uniview.options.ShowSmoothControl === false,
                        enableStopButton: false,
                        enableSoundIndicator: true
                    }
                },
                {
                    component: uiProcedureMessageModal,
                    options: {
                        willReturnAlertBody: function (eventInfo) {
                            var el = document.getElementById(eventInfo.description);
                            return el && el.cloneNode(true);
                        },
                        willSkipAlert: function (eventInfo) {
                            var el = document.getElementById(eventInfo.description);
                            if (!el) {
                                console.error('Element with ID "' + eventInfo.description + '" not found in document.');
                            }
                            return !el;
                        }
                    }
                }
            ], options);
        }

        fig.render([uiProcedureToolbarDrawing, uiProcedureContextMenu], solo.expand({
            drawingMode: !solo.uniview.with3D
        }, options));

        var iframe = view.render(uiMultimedia, options),
            docLinks = require('actions/doc-links');

        var m_waitSoloResource;

        if (!solo.uniview.with3D && !solo.app.ui.showCanvas) {
            solo.expand(solo.app, {
                procedure: {
                    pause: function () { }
                },
                ui: {
                    showCanvas: function (flag) {
                        if (flag) {
                            skin.hide(iframe.$el);
                        }
                    }
                }
            });
        }

        var uiDocumentOptions = solo.expand({
            disable3DLink: !solo.uniview.with3D,
            handlers: {
                link2d: function () {
                    skin.hide(iframe.$el);
                    solo.app.procedure.toggleDrawingDisplayMode(true);
                    docLinks.link2d.call(this);
                },
                link3d: !solo.uniview.with3D ? void 0 : function () {
                    skin.hide(iframe.$el);
                    docLinks.link3d.call(this);
                },
                linkMedia: function () {
                    var src = this.dataset.ixml || this.dataset.src,
                        base = solo.app.modelInfo.baseURL || solo.app.modelInfo.bundleURL,
                        type = /\.(wrl|vrml|cortona3d|solo|vmb|interactivity\.xml)$/i.test(src) ? 'solo' : this.dataset.multimediatype,
                        controls = this.dataset.showplugincontrols !== 'hide',
                        url = solo.app.util.toUrl(src, base);

                    var nop = function () { };

                    switch (type) {
                        case '3D':
                        case 'solo':
                            if (!m_waitSoloResource) {
                                m_waitSoloResource = true;

                                solo.dispatch('uniview.showAllPanels');
                                solo.dispatch('uniview.linkMedia', this);

                                solo.app.procedure.toggleDrawingDisplayMode(true);
                                solo.app.drawing.show(false);
                                skin.show(iframe.$el);

                                iframe
                                    .loadSoloResource(url, solo.expand({}, solo.uniview.options, {
                                        lang: solo.uniview.config.lang,
                                        factory: 'uniview-generic',
                                        totalMemory: +solo.uniview.options.TotalMemory || 256,
                                        components: {
                                            uiProcedureToolbar: !controls ? nop : null,
                                            uiToolbarSceneNavigation: !controls ? nop : null,
                                            uiProcedureToolbarPartSelection: !controls ? nop : null
                                        }
                                    }, getOptionsFromDataset(this.dataset)))
                                    .then(function () {
                                        iframe.window.Cortona3DSolo.uniview.css.render({
                                            '.main.panel': {
                                                border: 'none'
                                            }
                                        });
                                        iframe.window.Cortona3DSolo.dispatch("core.didChangeLayout");
                                        iframe.window.Cortona3DSolo.app.jumpToStandardView('isometric');
                                        m_waitSoloResource = false;
                                    })
                                    .catch(function () {
                                        m_waitSoloResource = false;
                                    });
                            }
                            solo.app.procedure.pause();
                            break;
                        default:
                            m_waitSoloResource = false;
                            solo.dispatch('uniview.showAllPanels');
                            solo.dispatch('uniview.linkMedia', this);

                            solo.app.procedure.toggleDrawingDisplayMode(true);
                            solo.app.drawing.show(false);

                            solo.dispatch('uniview.multimedia.load', url, {
                                type: type,
                                autoplay: +this.dataset.autoplay,
                                fullscreen: +this.dataset.fullscreen,
                                controls: controls
                            });

                            solo.app.procedure.pause();
                    }
                },
                footnote: docLinks.footnote
            }
        }, options);

        function secondaryHandler(handler) {
            return function () {
                if (this.dataset.show === 'other') {
                    solo.dispatch('uniview.secondaryFigure', this);
                    return;
                }
                handler.call(this);
            };
        }

        if (uiSecondaryFigurePanel) {
            uiDocumentOptions.handlers.link2d = secondaryHandler(uiDocumentOptions.handlers.link2d);
            uiDocumentOptions.handlers.linkMedia = secondaryHandler(uiDocumentOptions.handlers.linkMedia);
        }

        doc.render(
            uiDocument,
            uiDocumentOptions
        );

        if (solo.uniview.options.Enable3DPartSelection && solo.uniview.options.AllowSelectedObjectsExternal3DView) {
            auxview && auxview.render(
                uiExternal3DPanel,
                options
            );
        }

        if (uiSecondaryFigurePanel && mainview) {
            mainview.render([
                uiSecondaryFigureToolbar,
                uiSecondaryFigurePanel
            ], options);
        }

        solo.on('app.procedure.didDrawingDisplayMode', function () {
            solo.dispatch('uniview.multimedia.toggle', false);
        });

        solo.once('uniview.doc.didLoadComplete', function (docContainer) {
            var documentFilter = doc.create(uiDocumentFilter, options);

            doc.render([
                documentFilter,
                {
                    component: uiDocumentToolbar,
                    options: {
                        filterComponent: documentFilter
                    }
                }
            ], options);

            if (solo.uniview.with3D) {
                solo.dispatch('uniview.showAllPanels');
                solo.app.procedure.requestPlayerState();

                // changes the sequence of steps in the procedure after changing the document's applicability filter
                solo.on('uniview.doc.filterChanged', function () {
                    var hiddenSteps = [],
                        ixml = solo.uniview.ixml,
                        steps = ixml.getProcedureItemInfo(ixml.getProcedureId()).children;

                    docContainer.querySelectorAll('.filterHide .link.link3d').forEach(function (el) {
                        var dataset = el.dataset;
                        if ((!dataset.context || dataset.context === 'step') && hiddenSteps.indexOf(dataset.key) < 0) {
                            hiddenSteps.push(dataset.key);
                        }
                    });

                    function isHidden(id) {
                        return hiddenSteps.indexOf(id) >= 0;
                    }

                    steps = (steps && steps.some(isHidden)) ? steps.filter(function (id) {
                        return !isHidden(id);
                    }) : [];

                    var contextItemId = solo.app.procedure.getContextItemId();
                    solo.app.procedure.setPlayableItemList();
                    solo.app.procedure.seekToSubstep(solo.uniview.ixml.getProcedureId())

                    if (steps.length) {
                        solo.app.procedure.seekToSubstep(steps[0]);
                        solo.app.procedure.setPlayableItemList(steps);
                    }
                    solo.app.procedure.setPlayPosition(solo.app.procedure.duration, false);
                    solo.app.procedure.setPlayPosition(0, false);
                    solo.app.procedure.seekToSubstep(contextItemId);
                });
            }

            if (options.useTitleFor3DLinkButton && typeof i18n.activateStep == 'string') {
                docContainer.querySelectorAll('.link.link3d').forEach(function (el) {
                    el.title = i18n.activateStep;
                });
            }
        });

        // apply UI publish options
        skin.create(uiProcedureApplyPublishOptions, options);

        skin.create(uiProcedureKeymap, options);

        if (!solo.uniview.with3D) {
            solo.dispatch('uniview.toggleAuxPanelOnlyMode', true);
        }

        var title = (solo.uniview.ixml.getProcedureItemInfo(solo.uniview.ixml.getProcedureId()) || {}).description;
        if (title && !solo.uniview.metadata.TITLE) {
            document.title = title + ' - ' + solo.uniview.description;
        }

        skin.create(uiApplyProcedureHashParams, options);

        solo.on('app.procedure.didChangePlayableItemList', function (duration, items) {

            solo.uniview.css.render({
                '.doc-container span.hidden-link3d.link3d': {
                    display: 'none'
                }
            });

            document.querySelectorAll('.link3d').forEach(function (n) {
                var id = n.dataset.key,
                    stepInfo = solo.uniview.ixml.getProcedureItemInfo(id),
                    isHidden = !!items;

                if (items && stepInfo) {
                    while (stepInfo.type !== 'procedure') {
                        if (stepInfo.type === 'step' && items.indexOf(id) >= 0) {
                            isHidden = false;
                            break;
                        }
                        id = stepInfo.parent;
                        stepInfo = solo.uniview.ixml.getProcedureItemInfo(id);
                    }
                }

                if (isHidden) {
                    n.classList.add('hidden-link3d');
                } else {
                    n.classList.remove('hidden-link3d');
                }
            });
        });
    };
});