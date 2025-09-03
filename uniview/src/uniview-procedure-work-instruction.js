/**
 * A function module to display the interactive procedure created by Cortona3D RapidManual with the specification set to the specification name from the group of Rapid Work Instructions (RWI) procedures.
 * 
 * This is the default customization module to display any interactive RWI procedure.
 * 
 * @module uniview-procedure-work-instruction
 * @requires module:addons/procedure
 * @requires module:addons/rwi
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');
    require('css!uniview-procedure-work-instruction.css');

    /**
     * A factory function.
     * @async
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiApplyPublishOptions The factory function of the component used to apply common publish options
     * @param {factory} options.components.uiProcedureApplyPublishOptions The factory function of the component used to apply the procedure publish options
     * @param {factory} options.components.uiProcedureContextMenu The factory function of the component used to display the context menu
     * @param {factory} options.components.uiProcedureCommentPanel The factory function of the component used to display the comment pane
     * @param {factory} options.components.uiProcedureMessageModal The factory function of the component used to display the message modal pane
     * @param {factory} options.components.uiProcedureSettingsPanel The factory function of the component used to display the procedure settings pane
     * @param {factory} options.components.uiProcedureToolbarDrawing The factory function of the component used to display the drawing toolbar
     * @param {factory} options.components.uiProcedureToolbarPartSelection The factory function of the component used to display the toolbar to control the selected parts
     * @param {factory} options.components.uiRwiApplyPublishOptions The factory function of the component used to apply the RWI publish options
     * @param {factory} options.components.uiRwiFigure The factory function of the component used to display the RWI figure
     * @param {factory} options.components.uiRwiToolbarProcedure The factory function of the component used to display the RWI procedure toolbar
     * @param {factory} options.components.uiRwiHeader The factory function of the component used to display the RWI document header
     * @param {factory} options.components.uiRwiTabs The factory function of the component used to display the tab container for RWI
     * @param {factory} options.components.uiRwiToolbar The factory function of the component used to display the RWI document toolbar
     * @param {factory} options.components.uiRwiKeymap The factory function of the component to control the application using the keyboard
     * @param {factory} options.components.uiApplyProcedureHashParams The factory function of the component used to apply onHashChange handler
     * @param {factory} options.components.uiMultimedia The factory function of the component used to display the attached multimedia content
     * @param {factory} options.components.uiExternal3DPanel The factory function of the component used to display selected objects in an separate 3d window
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"uniview.settings.changedPMI"
     * @fires Cortona3DSolo~"uniview.showAllPanels"
     * @listen Cortona3DSolo~"app.procedure.didDrawingDisplayMode"
     * @tutorial module-uniview-procedure-work-instruction
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        require('addons/procedure');

        var i18n = solo.uniview.i18n['procedure-work-instructions'] || {};

        var opt = options.components || {},
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),

            uiRwiApplyPublishOptions = opt.uiRwiApplyPublishOptions || require('spec/lib/apply-pub-options-procedure-rwi'),
            uiProcedureApplyPublishOptions = opt.uiProcedureApplyPublishOptions || require('spec/lib/apply-pub-options-procedure'),
            uiProcedureContextMenu = opt.uiProcedureContextMenu || require('components/rococo/solo-skin-procedure-context-menu'),
            uiProcedureCommentPanel = opt.uiProcedureCommentPanel || require('components/rococo/solo-skin-procedure-comment-panel'),
            uiProcedureMessageModal = opt.uiProcedureMessageModal || require('components/rococo/solo-skin-procedure-message-modal'),
            uiProcedureSettingsPanel = opt.uiProcedureSettingsPanel || require('components/rococo/solo-skin-procedure-settings-panel'),
            uiProcedureToolbarDrawing = opt.uiProcedureToolbarDrawing || require('components/rococo/solo-skin-toolbar-procedure-drawing'),
            uiProcedureToolbarPartSelection = opt.uiProcedureToolbarPartSelection || require('components/rococo/solo-skin-procedure-toolbar-part-selection'),

            uiRwiFigure = opt.uiRwiFigure || require('components/rococo/solo-skin-rwi-figure'),
            uiRwiToolbarProcedure = opt.uiRwiToolbarProcedure || require('components/rococo/solo-skin-rwi-procedure-toolbar'),
            uiRwiHeader = opt.uiRwiHeader || require('components/rococo/solo-skin-rwi-header'),
            uiRwiTabs = opt.uiRwiTabs || require('components/rococo/solo-skin-rwi-tabs'),
            uiRwiToolbar = opt.uiRwiToolbar || require('components/rococo/solo-skin-rwi-toolbar'),
            uiRwiKeymap = opt.uiRwiKeymap || require('components/rococo/solo-skin-rwi-keymap'),

            uiRwiSearch = opt.uiRwiSearch || require('components/rococo/solo-skin-rwi-search'),
            uiRwiSelect3D = opt.uiRwiSelect3D || require('components/rococo/solo-skin-rwi-select-3d'),

            uiRwiDocumentInput = opt.uiRwiDocumentInput || require('components/rococo/solo-skin-rwi-document-input'),
            uiApplyProcedureHashParams = opt.uiApplyProcedureHashParams || require('spec/lib/apply-procedure-hash-params'),
            uiMultimedia = opt.uiMultimedia || require('components/rococo/solo-skin-multimedia'),
            uiExternal3DPanel = opt.uiExternal3DPanel || require('components/rococo/solo-skin-external-3d-panel');


        var fig = solo.skin.get('main'),
            doc = solo.skin.get('aux'),
            view = solo.skin.get('view'),
            auxview = solo.skin.get('aux-secondary') || solo.skin.get('auxview');

        var lang = (solo.uniview.options.SpecLang || 'en').split('-')[0];
        var cssName = "rwi.css";
        solo.app.util.requirePromise("css!static/i18n/" + lang + "/" + cssName)
            .catch(function () {
                return solo.app.util.requirePromise("css!static/i18n/en/" + cssName);
            });

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            if (drawingMode) {
                view.classList.add('display-mode-2d');
            } else {
                view.classList.remove('display-mode-2d');
            }
            solo.dispatch('uniview.multimedia.toggle', false);
        });

        if (!solo.uniview.options.helpUrl) {
            solo.uniview.options.helpUrl = requirejs.toUrl(
                'static/help/rwi/' + solo.uniview.config.lang + '/help.html'
            );
        }

        solo.app.procedure.defaultSeekMode = solo.app.procedure.SEEK_TO_START;

        // load rwi.xml async
        return Promise
            .resolve(require('addons/rwi'))
            .then(function (rwi) {

                var title = rwi.interactivity.json.$text('rwi/title');
                if (title && !solo.uniview.metadata.TITLE) {
                    document.title = title + ' - ' + solo.uniview.description;
                }

                skin.create(uiApplyPublishOptions, options);

                view.render([
                    uiMultimedia,
                    uiProcedureCommentPanel,
                    {
                        component: uiProcedureSettingsPanel,
                        options: {
                            disableLock: true,
                            enableAutoHide: true,
                            hideSelectionModeSetting: !solo.uniview.options.Enable3DPartSelection,
                            auxSettings: {
                                name: "PMI",
                                label: i18n.PMI,
                                value: solo.uniview.options.EnablePMI,
                                hidden: !solo.uniview.options.ShowPMIBox,
                                onchange: function (value) {
                                    solo.rwi.togglePMI(value);
                                }
                            }
                        }
                    }
                ], options);

                var procedureToolbarDrawing = fig.create(uiProcedureToolbarDrawing, solo.expand({ disableSheetButtons: true }, options));

                fig.render([
                    uiProcedureContextMenu,
                    procedureToolbarDrawing,
                    uiRwiFigure,
                    {
                        component: uiRwiToolbarProcedure,
                        options: {
                            expandToPlayRange: true,
                            disableSeekControl: solo.uniview.options.ShowSmoothControl === false,
                            enableStopButton: true,
                            enableSignOffButton: true,
                            enableSoundIndicator: true
                        }
                    },
                    solo.uniview.options.Enable3DPartSelection ? {
                        component: uiProcedureToolbarPartSelection,
                        options: { selectByDocID: true }
                    } : function () { },
                    {
                        component: uiProcedureMessageModal,
                        options: {
                            willReturnAlertBody: function (eventInfo) {
                                var el = document.getElementById(eventInfo.description);
                                return el && skin.span({
                                    innerHTML: el.innerHTML
                                });
                            },
                            willReturnAlertTitle: function (eventInfo) {
                                return " ";
                            }
                        }
                    }

                ], options);

                doc.render([
                    uiRwiHeader,
                    uiRwiTabs,
                    uiRwiToolbar,
                    solo.uniview.options.EnableSearch ? uiRwiSearch : function () { }
                ], options);

                auxview && auxview.render([
                    solo.uniview.options.Enable3DPartSelection && solo.uniview.options.AllowSelectedObjectsExternal3DView ? uiExternal3DPanel : function () { },
                ], options);

                if (solo.uniview.options.EnableRWI3DSelection) skin.create(uiRwiSelect3D);

                skin.create(uiRwiDocumentInput, options);

                procedureToolbarDrawing.classList.remove('top');
                procedureToolbarDrawing.classList.add('bottom');

                solo.app.procedure.requestPlayerState();

                // apply UI publish options
                skin.create(uiProcedureApplyPublishOptions, options);
                skin.create(uiRwiApplyPublishOptions, options);

                skin.create(uiRwiKeymap, options);

                if (solo.uniview.with3D) {
                    solo.dispatch('uniview.showAllPanels');
                }

                skin.create(uiApplyProcedureHashParams, options);

                solo.on('app.procedure.didChangePlayableItemList', function (duration, items) {

                    solo.uniview.css.render({
                        '.document .skin-tree-item-leaf.hidden-step': {
                            display: 'none'
                        }
                    });

                    document.querySelectorAll('.document .skin-tree-item .content').forEach(function (n) {
                        var id = n.dataset.id,
                            stepInfo = solo.uniview.ixml.getProcedureItemInfo(id),
                            isHidden = !!items;

                        if (items) {
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
                            n.parentNode.parentNode.classList.add('hidden-step');
                        } else {
                            n.parentNode.parentNode.classList.remove('hidden-step');
                        }
                    });

                    solo.dispatch('rwi.didResetJob');

                    solo.uniview.settings.Mode = 0;
                });

                var t_checkVisibilty,
                    n_checkVisibilty = null;

                solo.on('app.procedure.didChangePlayerState', function (position, state) {
                    function checkVisibilty(el) {
                        var handles = solo.uniview.ixml.getObjects(el.dataset.xrefid || el.dataset.id),
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

                    var currentStepParts = Array.prototype.slice.call(document.querySelectorAll('.instructions a.xref[data-xrefid], .instructions .bom .skin-tree-item [data-id].content'))
                        .map(function (n) {
                            return n.dataset.xrefid || n.dataset.id;
                        });

                    n_checkVisibilty = Array.prototype.slice.call(document.querySelectorAll('a.xref[data-xrefid], .bom .skin-tree-item [data-id].content'))
                        .sort(function (a, b) {
                            var aid = a.dataset.xrefid || a.dataset.id,
                                bid = b.dataset.xrefid || b.dataset.id,
                                ka = currentStepParts.indexOf(aid) < 0 ? 0 : 1,
                                kb = currentStepParts.indexOf(bid) < 0 ? 0 : 1;
                            if (ka > kb) return 1;
                            if (ka < kb) return -1;
                            return 0
                        });
                    nextChunk();
                });

            });
    };

});

/**
 * @event Cortona3DSolo~"uniview.settings.changedPMI"
 * @type {boolean}
 */