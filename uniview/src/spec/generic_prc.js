/**
 * 
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');

    module.exports = function (skin, options, solo) {
        require('addons/procedure');

        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['procedure-with-document'] || {};

        var opt = options.components || {},
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),
            uiProcedureApplyPublishOptions = opt.uiProcedureApplyPublishOptions || require('./lib/apply-pub-options-procedure'),
            uiProcedureContextMenu = opt.uiProcedureContextMenu || require('components/rococo/solo-skin-procedure-context-menu'),
            uiProcedureCommentPanel = opt.uiProcedureCommentPanel || require('components/rococo/solo-skin-procedure-comment-panel'),
            uiProcedureToolbar = opt.uiProcedureToolbar || require('components/rococo/solo-skin-procedure-toolbar'),
            uiProcedureMessageModal = opt.uiProcedureMessageModal || require('components/rococo/solo-skin-procedure-message-modal'),
            uiProcedureSettingsPanel = opt.uiProcedureSettingsPanel || require('components/rococo/solo-skin-procedure-settings-panel'),
            uiProcedureToolbarPartSelection = opt.uiProcedureToolbarPartSelection || require('components/rococo/solo-skin-procedure-toolbar-part-selection'),
            uiProcedureKeymap = opt.uiProcedureKeymap || require('components/rococo/solo-skin-procedure-keymap'),
            uiToolbarSceneNavigation = opt.uiToolbarSceneNavigation || require('components/rococo/solo-skin-toolbar-scene-navigation'),
            uiDocument = opt.uiDocument || require('components/doc'),
            uiApplyProcedureHashParams = opt.uiApplyProcedureHashParams || require('spec/lib/apply-procedure-hash-params'),
            uiExternal3DPanel = opt.uiExternal3DPanel || require('components/rococo/solo-skin-external-3d-panel');

        var fig = solo.skin.get('main'),
            doc = solo.skin.get('aux'),
            view = solo.skin.get('view'),
            auxview = solo.skin.get('aux-secondary') || solo.skin.get('auxview');

        solo.on('uniview.doc.didLoadComplete', function (element) {
            var isDocumentEmpty = element.children.length === 0;
            if (isDocumentEmpty) {
                solo.dispatch('uniview.toggleMainPanelOnlyMode', true);
                skin.classList.add('uniview-empty-document');
            }
            solo.app.procedure.requestPlayerState();
        });

        skin.create(uiApplyPublishOptions, options);

        view.render([
            uiProcedureCommentPanel,
            {
                component: uiProcedureSettingsPanel,
                options: {
                    enableAutoHide: true,
                    auxSettings: {
                        name: "Comment",
                        label: i18n.labelShowComments
                    }
                }
            }
        ], options);

        fig.render([
            uiProcedureContextMenu,
            uiToolbarSceneNavigation,
            solo.uniview.options.Enable3DPartSelection ? uiProcedureToolbarPartSelection : function () { },
            uiProcedureMessageModal,
            {
                component: uiProcedureToolbar,
                options: {
                    disableFastForward: solo.uniview.options.ShowPrevNextButtons === false,
                    disableSeekControl: solo.uniview.options.ShowSmoothControl === false,
                    disableDurationView: solo.uniview.options.ShowSmoothControl === false,
                    enableStopButton: false,
                    enableSoundIndicator: true
                }
            }
        ], options);

        doc.render({
            component: uiDocument,
            options: {
                disable3DLink: !solo.uniview.with3D,
                preventFetchDocument: true
            }
        }, options);

        auxview && auxview.render([
            solo.uniview.options.Enable3DPartSelection && solo.uniview.options.AllowSelectedObjectsExternal3DView ? uiExternal3DPanel : function () { }
        ], options);
        
        solo.on('app.procedure.didEnterSubstepWithName', options.univiewDocActivate || function (substepid) {
            var idStep = solo.app.procedure.getContextItemId(substepid),
                idSubstep = solo.app.procedure.getActiveItemId(substepid);
            solo.dispatch('uniview.doc.activate', idStep, idSubstep);
        });

        solo.on('app.procedure.didSelectSubstep', function (id) {
            solo.app.procedure.seekToSubstep(id);
            if (solo.uniview.options.StartAfterNavigate) {
                solo.app.procedure.play();
            }
        });

        // apply UI publish options
        skin.create(uiProcedureApplyPublishOptions, options);

        skin.create(uiProcedureKeymap, options);

        var title = ixml.getProcedureItemInfo(ixml.getProcedureId()).description;
        if (title && !solo.uniview.metadata.TITLE) {
            document.title = title + ' - ' + solo.uniview.description;
        }

        solo.dispatch('uniview.showAllPanels');

        skin.create(uiApplyProcedureHashParams, options);

        solo.on('app.procedure.didChangePlayableItemList', function (duration, items) {

            solo.uniview.css.render({
                '.hidden-step': {
                    display: 'none'
                }
            });

            document.querySelectorAll('.tiramisu-procedure .tiramisu-proc-item').forEach(function (n) {
                var id = n.id,
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
                    n.classList.add('hidden-step');
                } else {
                    n.classList.remove('hidden-step');
                }
            });
        });
    };
});