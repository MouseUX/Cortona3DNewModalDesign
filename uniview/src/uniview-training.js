/**
 * A function module to display the interactive training from the RapidLearning program.
 * 
 * This is the default customization module to display any virtual training.
 * 
 * @module uniview-training
 * @requires module:addons/procedure
 * @requires module:addons/training
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');
    require('css!uniview-training.css');

    var uriParams = require('lib/uri-parameters');

    function round2(x) {
        return Math.round(x * 100) / 100;
    }

    /**
     * A factory function.
     * @async
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiApplyPublishOptions The factory function of the component used to apply common publish options
     * @param {factory} options.components.uiProcedureApplyPublishOptions The factory function of the component used to apply the procedure publish options
     * @param {factory} options.components.uiTrainingApplyPublishOptions The factory function of the component used to apply the training publish options
     * @param {factory} options.components.uiProcedureContextMenu The factory function of the component used to display the context menu
     * @param {factory} options.components.uiProcedureCommentPanel The factory function of the component used to display the comment pane
     * @param {factory} options.components.uiProcedureSettingsPanel The factory function of the component used to display the procedure settings pane
     * @param {factory} options.components.uiProcedureToolbarDrawing The factory function of the component used to display the drawing toolbar
     * @param {factory} options.components.uiTrainingAlertModal The factory function of the component used to display the alert modal pane
     * @param {factory} options.components.uiTrainingFigure The factory function of the component used to display the training figure
     * @param {factory} options.components.uiTrainingHeader The factory function of the component used to display the training document header
     * @param {factory} options.components.uiTrainingTabs The factory function of the component used to display the tab container for training 
     * @param {factory} options.components.uiTrainingMessage The factory function of the component used to display the inline message pane
     * @param {factory} options.components.uiTrainingAction The factory function of the component used to display the action pane
     * @param {factory} options.components.uiTrainingToolbar The factory function of the component used to display the training toolbar
     * @param {factory} options.components.uiTrainingToolbarFigure The factory function of the component used to display the toolbar of the training figure 
     * @param {factory} options.components.uiTrainingToolbarFigureTop The factory function of the component used to display the top toolbar of the training figure 
     * @param {factory} options.components.uiTrainingToolbarProcedure The factory function of the component used to display the toolbar of the training procedure
     * @param {factory} options.components.uiTrainingKeymap The factory function of the component to control the application using the keyboard
     * @param {module:uniview-training~getScenarioTitle} options.getScenarioTitle The function retuns the title of the training scenario
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"training.activate"
     * @fires Cortona3DSolo~"training.showActHelp"
     * @fires Cortona3DSolo~"training.clearActForms"
     * @fires Cortona3DSolo~"training.messages"
     * @fires Cortona3DSolo~"training.clearSelectedParts"
     * @fires Cortona3DSolo~"training.didSwitchOffScenarioMode"
     * @fires Cortona3DSolo~"training.allowObjectInteraction"
     * @fires Cortona3DSolo~"training.buildActForms"
     * @fires Cortona3DSolo~"training.showAlert"
     * @fires Cortona3DSolo~"training.didEnableForward"
     * @fires Cortona3DSolo~"training.didEnableBackward"
     * @fires Cortona3DSolo~"training.didChangeFailedStepScaledScore"
     * @fires Cortona3DSolo~"training.allowObjectInteraction"
     * @fires Cortona3DSolo~"uniview.settings.changedHighlightParts"
     * @fires Cortona3DSolo~"uniview.settings.changedContinuousMode"
     * @fires Cortona3DSolo~"uniview.settings.changedDirectHints"
     * @listens Cortona3DSolo~"uniview.settings.changedDisableAlertMessages"
     * @listens Cortona3DSolo~"uniview.doc.didLoadComplete"
     * @listens Cortona3DSolo~"app.procedure.didDrawingDisplayMode"
     * @listens Cortona3DSolo~"training.showAlert"
     * @listens Cortona3DSolo~"training.clearActForms"
     * @listens Cortona3DSolo~"training.didSwitchOffScenarioMode"
     * @listens Cortona3DSolo~"app.procedure.didFinish"
     * @listens Cortona3DSolo~"training.activate"
     * @listens Cortona3DSolo~"training.didStartScenario"
     * @listens Cortona3DSolo~"training.didFinishScenario"
     * @listens Cortona3DSolo~"training.didCancelScenario"
     * @listens Cortona3DSolo~"training.didFinishScenarioStep"
     * @listens Cortona3DSolo~"training.didStartScenarioStep"
     * @listens Cortona3DSolo~"training.didChangeExpectedOperations"
     * @listens Cortona3DSolo~"training.didScenarioOperations"
     * @listens Cortona3DSolo~"training.didFailScenarioStepInput"
     * @listens Cortona3DSolo~"app.procedure.didPlay"
     * @listens Cortona3DSolo~"app.procedure.didStop"
     * @listens Cortona3DSolo~"training.actionSkip"
     * @listens Cortona3DSolo~"training.allowObjectInteraction"
     * @listens Cortona3DSolo~"training.actionSubmit"
     * @listens Cortona3DSolo~"training.actionSubmitVar"
     * @listens Cortona3DSolo~"training.actionCancel"
     * @listens Cortona3DSolo~"training.actionLocation"
     * @listens Cortona3DSolo~"training.didObjectClick"
     * @listens Cortona3DSolo~"uniview.didCallContextMenu"
     * @tutorial module-uniview-training
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        require('addons/procedure');

        var opt = options.components || {},
            uiModal = require('components/modal'),
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),

            uiProcedureApplyPublishOptions = opt.uiProcedureApplyPublishOptions || require('spec/lib/apply-pub-options-procedure'),
            uiProcedureContextMenu = opt.uiProcedureContextMenu || require('components/rococo/solo-skin-procedure-context-menu'),
            uiProcedureCommentPanel = opt.uiProcedureCommentPanel || require('components/rococo/solo-skin-procedure-comment-panel'),
            uiProcedureSettingsPanel = opt.uiProcedureSettingsPanel || require('components/rococo/solo-skin-procedure-settings-panel'),
            uiProcedureToolbarDrawing = opt.uiProcedureToolbarDrawing || require('components/rococo/solo-skin-toolbar-procedure-drawing'),

            uiTrainingApplyPublishOptions = opt.uiTrainingApplyPublishOptions || require('spec/lib/apply-pub-options-training'),
            uiTrainingAlertModal = opt.uiTrainingAlertModal || require('components/rococo/solo-skin-trn-alert-modal'),
            uiTrainingFigure = opt.uiTrainingFigure || require('components/rococo/solo-skin-trn-figure'),
            uiTrainingHeader = opt.uiTrainingHeader || require('components/rococo/solo-skin-trn-header'),
            uiTrainingTabs = opt.uiTrainingTabs || require('components/rococo/solo-skin-trn-tabs'),
            uiTrainingMessage = opt.uiTrainingMessage || require('components/rococo/solo-skin-trn-message'),
            uiTrainingAction = opt.uiTrainingAction || require('components/rococo/solo-skin-trn-action'),
            uiTrainingKeymap = opt.uiTrainingKeymap || require('components/rococo/solo-skin-trn-keymap'),
            uiTrainingToolbar = opt.uiTrainingToolbar || require('components/rococo/solo-skin-trn-toolbar'),
            uiTrainingToolbarFigure = opt.uiTrainingToolbarFigure || require('components/rococo/solo-skin-trn-figure-toolbar'),
            uiTrainingToolbarFigureTop = opt.uiTrainingToolbarFigureTop || require('components/rococo/solo-skin-trn-figure-toolbar-top'),
            uiTrainingToolbarProcedure = opt.uiTrainingToolbarProcedure || require('components/rococo/solo-skin-trn-procedure-toolbar');

        var fig = solo.skin.get('main'),
            doc = solo.skin.get('aux'),
            view = solo.skin.get('view');

        // publish options unification
        solo.uniview.options.EnableWarnings = solo.uniview.options.OptionShowAlertBox;

        // app state
        var state = {
            isObjectInteraction: false,
            skipForward: false,
            skipOperation: false,
            options: {
                cancelExamAfterFailedStep: solo.uniview.options.CancelExamAfterFailedStep,
                enableFailIndicator: solo.uniview.options.EnableFailIndicator,
                disableAlertMessages: !solo.uniview.options.OptionShowAlertBox,
                enableHighlightParts: solo.uniview.options.OptionFlashPartInDemo,
                enableContinuousMode: solo.uniview.options.OptionContinuous,
                enableDirectHints: solo.uniview.options.OptionShowExpectedOperations,
                disableSoundInExam: solo.uniview.options.MuteAudioInExam
            }
        };

        opt = uriParams.get('caf');
        if (typeof opt !== 'undefined') {
            state.options.cancelExamAfterFailedStep = !!parseInt(opt);
        }
        opt = uriParams.get('fi');
        if (typeof opt !== 'undefined') {
            state.options.enableFailIndicator = !!parseInt(opt);
        }

        opt = (options.mode === 0) ? 0 : options.mode || uriParams.get('mode');
        if (typeof opt !== 'undefined') {
            opt = parseInt(opt);
            if (opt >= 0 && opt <= 2) {
                state.options.fixedMode = opt;
            }
        }

        if (!solo.uniview.options.helpUrl) {
            solo.uniview.options.helpUrl = requirejs.toUrl(
                'static/help/training/' + solo.uniview.config.lang + '/help.html'
            );
        }

        solo.on('uniview.settings.changedDisableAlertMessages', function (value) {
            state.options.disableAlertMessages = value;
        });

        function confirm(content) {
            return new Promise(function (resolve) {
                var modal = skin.render(uiModal, {
                    hideDismissButton: true,
                    disableAutoDismiss: true,
                    content: content,
                    footerContent: skin.container('.buttons-group',
                        skin.button({
                            classList: 'role-close',
                            onclick: function () {
                                skin.emit('modal.close');
                                resolve(true);
                            }
                        }, __("UI_BTN_YES")),
                        skin.button({
                            onclick: function () {
                                skin.emit('modal.close');
                                resolve(false);
                            }
                        }, __("UI_BTN_NO"))
                    )
                });
                modal.$el.focus();
            });
        }

        function confirmOk(content) {
            return new Promise(function (resolve) {
                var modal = skin.render(uiModal, {
                    hideDismissButton: false,
                    disableAutoDismiss: true,
                    content: content
                });
                modal.$el.focus();
                modal.once('closed', resolve);
            });
        }

        solo.on('training.didObjectClick', function (chain) {
            if (state.isObjectInteraction) {
                if (!solo.training.isDemo()) {
                    //doc_writeline("log", '<dl style="color:green"><dt>' + getTime() + ' | Action of the trainee:</dt><dd>' + getInputString(name) + '</dd></dl>');
                    solo.training.processInput(chain);
                    solo.training.processStep();
                    solo.dispatch('training.buildActForms', state);
                }
            }
        });

        solo.on('uniview.didCallContextMenu', function (options) {
            if (!solo.app.ui.isDrawingDisplayMode()) {
                options.menu.splice(1, 1);
            }
        });

        function executeOperation(operation) {
            var input = null;
            var activity = operation.activity;
            if (activity) {
                input = activity.getTemplate();
                switch (activity._type) {
                    case "Activity":
                        if (!state.skipForward && !state.skipOperation && state.options.enableHighlightParts) {
                            solo.app.procedure.drawAttentionEx(activity.objects.map(solo.app.getObjectWithName));
                        }
                        break;
                    case "RequestVariable":
                        if (!state.skipForward && !state.skipOperation) {
                            solo.dispatch('training.buildActForms', state);
                            return;
                        }
                        //doc_writeline("log", '<dl style="color:green;"><dt>' + getTime() + ' | Set default variable value</dt><dd>' + activity.getTemplate() + '</dd></dl>');
                        break;
                    case "Alert":
                        if (!state.skipForward && !state.skipOperation && !state.options.disableAlertMessages) {
                            solo.dispatch('training.showAlert', activity);
                            return;
                        }
                        break;
                }
            }
            solo.training.processInput(input);
        }

        function __(value) {
            var s = (solo.uniview.i18n['uniview-training'] || {})[value];
            return (typeof s !== 'string') ? value : s;
        }

        solo.uniview.i18n.__ = __;

        solo.touch.options.FEATURE_PICK_TOPMOST = false;
        solo.app.procedure.defaultSeekMode = solo.app.procedure.SEEK_TO_START;

        return Promise
            .resolve(require('addons/training'))
            .then(function (training) {

                var title = training.interactivity.json.$text('scenario/description');
                if (title && !solo.uniview.metadata.TITLE) {
                    document.title = title + ' - ' + solo.uniview.description;
                }

                skin.create(uiApplyPublishOptions, options);

                view.render([
                    uiProcedureCommentPanel,
                    {
                        component: uiProcedureSettingsPanel,
                        options: {
                            enableAutoHide: true,
                            disableLock: true,
                            hideSelectionModeSetting: true,
                            auxSettings: [{
                                name: "HighlightParts",
                                label: __("UI_OPT_FLASH_PART_IN_DEMO"),
                                value: state.options.enableHighlightParts,
                                onchange: function (value) {
                                    state.options.enableHighlightParts = value;
                                }
                            },
                            {
                                name: "ContinuousMode",
                                label: __("UI_OPT_CONTINUOUS"),
                                value: state.options.enableContinuousMode,
                                onchange: function (value) {
                                    state.options.enableContinuousMode = value;
                                }
                            },
                            {
                                name: "DirectHints",
                                label: __("UI_OPT_SHOW_EXPECTED_OPERATIONS"),
                                value: state.options.enableDirectHints,
                                onchange: function (value) {
                                    state.options.enableDirectHints = value;
                                }
                            }]
                        }
                    }
                ], options);

                var modalAlert = skin.create(uiTrainingAlertModal, solo.expand({
                    willReturnAlertBody: function (eventInfo) {
                        var syntax,
                            el = document.getElementById(eventInfo.odfId);
                        return el && skin.span({
                            innerHTML: el.outerHTML
                        });
                    }
                }, options)),
                    toolbarProcedure = skin.create(uiTrainingToolbarProcedure, solo.expand({
                        enableFailIndicator: state.options.enableFailIndicator,
                        fixedMode: state.options.fixedMode
                    }, options)),
                    trainingAction = skin.create(uiTrainingAction, options),
                    toolbar = skin.create(uiTrainingToolbar, solo.expand({
                        fixedMode: state.options.fixedMode
                    }, options)),
                    tabs = skin.create(uiTrainingTabs, options),
                    toolbarDrawing = skin.create(uiProcedureToolbarDrawing, options);

                toolbarDrawing.classList.remove('top');
                toolbarDrawing.classList.add('bottom');

                fig.render([
                    uiProcedureContextMenu,
                    toolbarDrawing,
                    uiTrainingFigure,
                    uiTrainingToolbarFigure,
                    uiTrainingToolbarFigureTop,
                    modalAlert
                ], options);


                doc.render([
                    tabs,
                    uiTrainingMessage,
                    trainingAction,
                    toolbarProcedure,
                    toolbar
                ], options);

                skin.hide(toolbarProcedure.$el, true);

                solo.on('uniview.doc.didLoadComplete', function (element) {
                    doc.render(uiTrainingHeader, {
                        scenarioTitle: options.getScenarioTitle && options.getScenarioTitle(element)
                    });
                });

                solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
                    if (drawingMode) {
                        view.classList.add('display-mode-2d');
                    } else {
                        view.classList.remove('display-mode-2d');
                        solo.dispatch('uniview.showAllPanels');
                    }
                });

                solo.on('training.showAlert', function (activity) {
                    modalAlert.emit('show', activity);
                    modalAlert.once('closed', function () {
                        //doc_writeline("log", '<dl style="color:#FF8000;"><dt>' + getTime() + ' | Alert</dt><dd>' + _alert_activity.getTemplate() + '</dd></dl>');
                        solo.training.processInput(activity);
                    });
                });

                solo.on('training.clearActForms', function () {
                    skin.clear(trainingAction.$el);
                });

                solo.on('training.didSwitchOffScenarioMode', function () {
                    skin.hide(toolbarProcedure.$el, true);
                    skin.show(toolbar.$el);
                });

                solo.on('training.ui.switchOffMode', function () {
                    confirm(__("MSG_ON_CANCEL_SCENARIO"))
                        .then(function (confirmed) {
                            if (confirmed) {
                                solo.training.cancel();
                            }
                        });
                });

                solo.on('training.ui.play', function () {
                    solo.training.playMode = solo.training.MODE_PLAY;
                    if (solo.app.procedure.position > 0 && solo.app.procedure.position < solo.app.procedure.duration && !solo.app.procedure.played) {
                        solo.app.procedure.play();
                    } else if (solo.training.expected.length) {
                        executeOperation(solo.training.expected[0]);
                    }
                });

                solo.on('training.ui.pause', function () {
                    solo.training.playMode = solo.training.MODE_PAUSE;
                    solo.app.procedure.pause();
                });

                solo.on('training.ui.stop', function () {
                    solo.training.playMode = solo.training.MODE_STOP;
                    solo.app.procedure.pause();
                    var stepAfterSkip = null;
                    if (!solo.training.history.isEmpty()) {
                        //disableAllInput("div_vcr", true);
                        state.skipBackward = true;
                        var s = solo.training.history.pop();
                        var substeps = s.getSubsteps();
                        stepAfterSkip = s.step;
                        solo.training.restoreVariables(s.variables_set);
                        if (substeps.length) {
                            solo.app.procedure.setPlayableItemList(substeps);
                            solo.app.procedure.setPlayPosition(solo.app.procedure.duration);
                            solo.once('app.procedure.onStartPosition', function () {
                                state.skipBackward = false;
                                if (stepAfterSkip) {
                                    solo.training.startStep(stepAfterSkip);
                                }
                            });
                            solo.app.procedure.stop();
                        } else {
                            solo.training.startStep(stepAfterSkip);
                        }
                        //solo.training.MODE_set_procedure(substeps, 1);
                        //solo.training.MODE_vcr_set_proc_fraction(0);
                    }
                });

                solo.on('training.ui.forward', function () {
                    solo.training.playMode = solo.training.MODE_STOP;
                    solo.app.procedure.pause();

                    state.skipForward = true;
                    solo.training.activeStep.initialize();
                    solo.training.processInput();

                    var operations = solo.training.activeStep.getOperations();
                    var substeps = [];
                    operations.forEach(function (operation) {
                        if (operation.animation) {
                            substeps = substeps.concat(operation.animation.substeps);
                        }
                        executeOperation(operation);
                    });

                    if (substeps.length) {
                        //console.log(substeps);
                        solo.app.procedure.setPlayableItemList(substeps);
                        solo.once('app.procedure.onEndPosition', function (position) {
                            state.skipForward = false;
                            solo.training.processStep();
                        });
                        solo.app.procedure.setPlayPosition(solo.app.procedure.duration, true);
                        //solo.training.MODE_set_procedure(substeps, 0);
                        //solo.training.MODE_vcr_set_proc_fraction(1);
                    } else {
                        state.skipForward = false;
                        solo.training.processStep();
                        //_on_proc_fraction_changed(1);
                    }
                });

                solo.on('app.procedure.didFinish', function () {
                    solo.training.processStep();
                });

                solo.on('training.ui.backward', function () {
                    solo.training.playMode = solo.training.MODE_STOP;
                    solo.app.procedure.pause();

                    var stepAfterSkip = null;

                    if (!solo.training.history.isEmpty()) {

                        //showActForm('');
                        //disableAllInput("div_vcr", true);
                        state.skipBackward = true;

                        var s;
                        var substeps = [];

                        if (solo.training.activeStep) {
                            s = solo.training.history.pop();
                            substeps = s.getSubsteps();
                            stepAfterSkip = s.step;
                            solo.training.restoreVariables(s.variables_set);
                        }

                        while (!solo.training.history.isEmpty()) {
                            s = solo.training.history.pop();
                            substeps = s.getSubsteps().concat(substeps);
                            stepAfterSkip = s.step;
                            solo.training.restoreVariables(s.variables_set);
                            if (!s.isNotInteractive())
                                break;
                        }

                        //console.log(substeps);
                        solo.app.procedure.setPlayableItemList(substeps);
                        solo.app.procedure.setPlayPosition(solo.app.procedure.duration);
                        solo.once('app.procedure.onStartPosition', function () {
                            state.skipBackward = false;
                            if (stepAfterSkip) {
                                solo.training.startStep(stepAfterSkip);
                            }
                        });
                        solo.app.procedure.stop();
                        //solo.training.MODE_set_procedure(substeps, 1);
                        //solo.training.MODE_vcr_set_proc_fraction(0);
                    }
                });

                solo.on('training.ui.activateMode', function (mode) {
                    solo.dispatch('training.activate', mode);
                });

                solo.on('training.activate', function (mode) {
                    skin.hide(toolbar.$el, true);
                    skin.show(toolbarProcedure.$el);
                    solo.training.start(mode);
                });

                solo.app.procedure.requestPlayerState();

                // apply UI publish options
                skin.create(uiProcedureApplyPublishOptions, options);
                skin.create(uiTrainingApplyPublishOptions, options)

                return tabs;
            })
            .then(function (tabs) {
                // scenario

                solo.on('training.didStartScenario', function (mode) {
                    solo.training.playMode = solo.training.MODE_STOP;

                    skin.classList.add('training-mode-' + mode);

                    state.skipForward = false;
                    state.skipBackward = false;
                    state.skipOperation = false;

                    state.isObjectInteraction = true;

                    if (solo.training.isDemo()) {
                        // to-do: loadODFStep(vte);
                        solo.dispatch('training.showActHelp', __("MSG_STARTED_DEMO"));
                    }

                    if (solo.training.isExam()) {
                        var nPartsTab = 2;
                        if (solo.uniview.options.HideDocumentTab) nPartsTab--;
                        if (solo.uniview.options.HideInstructionsTab) nPartsTab--;
                        tabs.emit('activate', nPartsTab);
                    }

                    if (solo.training.isExam() && state.options.disableSoundInExam) {
                        solo.app.configureInstance(solo.app.DISABLE_AUDIO);
                    } else {
                        solo.app.configureInstance(0, solo.app.DISABLE_AUDIO);
                    }

                    solo.app.procedure.toggleDrawingDisplayMode(false);

                    solo.training.sco.scenarioStart();
                });

                function onScenarioEnd(mode) {
                    solo.training.playMode = solo.training.MODE_STOP;

                    skin.classList.remove('training-mode-' + mode);

                    state.skipForward = false;
                    state.skipBackward = false;
                    state.skipOperation = false;

                    state.isObjectInteraction = false;

                    solo.app.procedure.stop();
                    solo.training.history.drop();
                    solo.app.procedure.setPlayableItemList();
                    setTimeout(function () {
                        solo.app.procedure.setPlayPosition(solo.app.procedure.duration);
                        solo.app.procedure.stop();
                    }, 10);

                    tabs.emit('setInstructionsHtml');

                    solo.dispatch('training.clearActForms');
                    solo.dispatch('training.messages');
                    solo.dispatch('training.clearSelectedParts');

                    solo.dispatch('training.showActHelp', [
                        __("MSG_ON_FINISH_SCENARIO_SCORM_STUDY_DEMO"),
                        __("MSG_ON_FINISH_SCENARIO_SCORM_STUDY_DEMO"),
                        __("MSG_ON_FINISH_SCENARIO_SCORM_EXAM")
                    ][mode]);

                    solo.dispatch('training.didSwitchOffScenarioMode');

                    solo.training.sco.scenarioFinish();
                }

                solo.on('training.didFinishScenario', function () {
                    var status = solo.training.getSuccessStatus();
                    var score = round2(solo.training.getScaledScore());
                    var mode = solo.training.mode;
                    if (solo.training.isExam()) {
                        confirmOk([
                            skin.container('.exam-results',
                                __("MSG_ON_FINISH_SCENARIO_EXAM"),
                                skin.container('',
                                    skin.text('', __("UI_TXT_FINISH_EXAM_STATUS"), ': '),
                                    skin.text('.status.status-' + status, __("UI_TXT_FINISH_EXAM_" + status.toUpperCase()))
                                ),
                                skin.container('',
                                    skin.text('', __("UI_TXT_FINISH_EXAM_SCORE"), ': '),
                                    skin.text('', String(Math.floor(score * 100)), '% ', __("UI_TXT_FINISH_EXAM_OF_MAXIMUM_POINTS"))
                                )
                            )
                        ])
                            .then(function () {
                                onScenarioEnd(mode);
                            });
                    } else {
                        confirm(__("MSG_ON_FINISH_SCENARIO_STUDY_DEMO"))
                            .then(function (confirmed) {
                                if (confirmed) {
                                    onScenarioEnd(mode);
                                    solo.dispatch('training.didSwitchOffScenarioMode');
                                } else {
                                    solo.training.resume();
                                    solo.dispatch('training.clearSelectedParts');
                                    //clearSelectedParts();
                                    //showActForm("");
                                }
                            });
                    }
                });
                solo.on('training.didCancelScenario', function () {
                    var mode = solo.training.mode;
                    if (solo.training.isExam()) {
                        confirmOk([
                            skin.container('.exam-results',
                                __("MSG_ON_FINISH_SCENARIO_EXAM"),
                                skin.container('',
                                    skin.text('', __("UI_TXT_FINISH_EXAM_STATUS"), ': '),
                                    skin.text('.status.status-canceled', __("UI_TXT_FINISH_EXAM_CANCELED"))
                                )
                            )
                        ])
                            .then(function () {
                                onScenarioEnd(mode);
                            });
                    } else {
                        onScenarioEnd(mode);
                    }
                });

                solo.on('training.didFinishScenarioStep', function (step) {
                    switch (solo.training.mode) {
                        case solo.training.MODE_DEMO:
                            if (!state.options.enableContinuousMode) {
                                solo.training.playMode = solo.training.MODE_STOP;
                            }
                            break;
                        case solo.training.MODE_STUDY:
                            tabs.emit('setInstructionsHtml');
                        case solo.training.MODE_EXAM:
                            solo.training.playMode = solo.training.MODE_STOP;
                            break;
                    }
                    solo.training.sco.stepFinished();
                });

                solo.on('training.didStartScenarioStep', function (step) {
                    solo.dispatch('training.didEnableForward', step.nextstep);
                    solo.dispatch('training.didEnableBackward', !solo.training.history.isEmpty());

                    switch (solo.training.mode) {
                        case solo.training.MODE_STUDY:
                        //loadODFStep(step);
                        case solo.training.MODE_DEMO:
                            //showODFStep(step);
                            tabs.emit('setInstructionsHtml', skin.create('.step-instruction',
                                skin.create('.step-description', step.description),
                                !step.comments ? '' : skin.create('.step-comment', step.comments.replace(/https?:\/\/[^\s\n\r]+/ig, '<a target=_blank href="$&">$&</a>'))
                            ).outerHTML);
                            //doc_writeline("log", '<dl style="color:red"><dt>' + getTime() + ' | Step started:</dt><dd>' + getText(oStep.description) + '</dd></dl>');
                            break;
                        case solo.training.MODE_EXAM:
                            break;
                    }
                    solo.training.sco.stepStarted();
                });

                solo.on('training.didChangeExpectedOperations', function (expected) {

                    // validateSelectedParts();
                    // validateVariablesFrame();

                    switch (solo.training.mode) {
                        case solo.training.MODE_DEMO:
                            if (expected.length && solo.training.playMode === solo.training.MODE_PLAY) {
                                executeOperation(expected[0]);
                                solo.dispatch('training.buildActForms', state);
                            }
                            break;
                        case solo.training.MODE_STUDY:
                            if (expected.length && (solo.training.playMode == solo.training.MODE_PLAY)) {
                                executeOperation(expected[0]);
                            } else {
                                solo.training.processInput();
                            }
                            solo.dispatch('training.buildActForms', state);
                            break;
                        case solo.training.MODE_EXAM:
                            solo.training.processInput();
                            solo.dispatch('training.buildActForms', state);
                            break;
                    }
                });

                solo.on('training.didScenarioOperations', function (operations, input) {
                    if (input) {
                        solo.dispatch('training.messages');
                    }

                    if (state.skipForward) return;

                    var substeps = [],
                        initialFraction = 0,
                        messages = [];

                    operations.forEach(function (operation) {
                        if (operation.animation) {
                            substeps = substeps.concat(operation.animation.substeps);
                            initialFraction = state.skipOperation ? 1 : operation.animation.initialFraction;
                        }
                        if (operation.message) {
                            messages.push(operation.message);
                        }

                        if (!solo.training.isExam()) {
                            if (!state.skipForward && !state.skipOperation) {
                                // to-do: showODFItem(operation);
                            }
                        }

                        // to-do: input log (?)
                    }, []);

                    state.skipOperation = false;

                    if (messages.length) {
                        var _t = (messages.join(' ').split(' ').length / 2 + 1) * 5;
                        solo.dispatch('training.messages', messages, _t);
                    }

                    if (substeps.length) {
                        //console.log(substeps);
                        state.skipForward = initialFraction >= 1;
                        solo.app.procedure.setPlayableItemList(substeps);
                        if (state.skipForward) {
                            solo.once('app.procedure.onEndPosition', function () {
                                state.skipForward = false;
                                solo.training.processStep();
                            });
                        }
                        solo.app.procedure.setPlayPosition(initialFraction * solo.app.procedure.duration, true);
                        if (initialFraction < 1) {
                            solo.app.procedure.play();
                        }
                    } else {
                        solo.training.processStep();
                    }

                });

                solo.on('training.didFailScenarioStepInput', function (step, input) {
                    //windowShake();

                    if (solo.training.isStudy() || (solo.training.isExam() && !state.options.cancelExamAfterFailedStep)) {
                        //doc_writeline("log", '<dl style="color:red"><dt>' + getTime() + ' | Wrong trainee action.</dt></dl>');
                        solo.dispatch('training.messages', __("MSG_WRONG_ACTION"), 4, true);
                    }

                    if (solo.training.isExam()) {
                        if (state.options.cancelExamAfterFailedStep) {
                            var ra = step.getRemainingAttempts();
                            ra = (ra < 0) ? 'infinite' : ra;
                            //doc_writeline("log", '<dl style="color:red"><dt>' + getTime() + ' | Wrong trainee action. Remaining attempt(s): ' + ra + '</dt></dl>');
                            solo.dispatch('training.messages', __("MSG_WRONG_ACTION_ATTEMPTS") + ' ' + ra, 4, true);
                        }

                        if (step.errorLimits >= 0) {
                            solo.training.sco.stepFailed();
                            solo.dispatch('training.didChangeFailedStepScaledScore', step.getScaledScore());
                            if (state.options.cancelExamAfterFailedStep && step.errors > step.errorLimits) {
                                solo.training.fail();
                            }
                        }
                    }
                });

                solo.on('app.procedure.didPlay', function () {
                    solo.dispatch('training.clearActForms');
                    state.isObjectInteraction = false;
                    solo.app.restoreObjectProperty(0, solo.app.PROPERTY_EMISSIVE_COLOR, true);
                    //_on_object_over(null);
                    //showStatus(__("STATUS_ANI_ACTIVATED"));
                });

                solo.on('app.procedure.didStop', function () {
                    state.isObjectInteraction = true;
                });

                solo.on('training.actionSkip', function (index) {
                    // old: on_form_skip(n)

                    if (solo.training.playMode != solo.training.MODE_PLAY) {
                        //disableAllInput("div_vcr", false);
                        //refreshPause();

                        solo.dispatch('training.allowObjectInteraction', true);

                        solo.training.playMode = solo.training.MODE_PAUSE;
                        state.skipOperation = true;
                        solo.dispatch('training.clearActForms');
                        var input = solo.training.expected[index].activity.getTemplate();
                        //doc_writeline("log", '<dl style="color:green"><dt>' + getTime() + ' | Skip:</dt><dd>' + getInputString(input) + '</dd></dl>');
                        solo.training.processInput(input);
                    }
                });

                solo.on('training.allowObjectInteraction', function (enabled) {
                    state.isObjectInteraction = enabled;
                });

                solo.on('training.actionSubmit', function (index, param) {
                    // old: on_form_submit(n)

                    solo.dispatch('training.allowObjectInteraction', true);

                    var activity = solo.training.expected[index].activity;
                    var input = activity.getTemplate();
                    input.para = param;

                    // reset selected items for _leo
                    if (activity.objects.length) {
                        solo.training.expected.forEach(function (operation, i) {
                            if (i !== index) {
                                operation.initialize();
                            }
                        });
                    }
                    //doc_writeline("log", '<dl style="color:green"><dt>' + getTime() + ' | Action of the trainee:</dt><dd>' + getInputString(input) + '</dd></dl>');
                    solo.training.processInput(input);
                });

                solo.on('training.actionSubmitVar', function (name, type, value) {
                    // old: on_submit_var(name, type)

                    var input = solo.training.createVariable(name, type);
                    if (type == 'number' || type == 'numeric') {
                        if (isNaN(Number(value))) {
                            alert(__("WARNING_NUMERIC_VALUE"));
                            return;
                        }
                    }
                    input.setValue(value);

                    //doc_writeline("log", '<dl style="color:green"><dt>' + getTime() + ' | Action of the trainee:</dt><dd>' + getInputString(input) + '</dd></dl>');

                    solo.training.processInput(input);
                    solo.dispatch('training.buildActForms', state);
                });

                solo.on('training.actionCancel', function (index) {
                    // old: on_form_cancel(n)

                    solo.dispatch('training.allowObjectInteraction', true);

                    solo.training.expected[index].activity.initialize();
                    solo.training.processStep();
                    solo.dispatch('training.buildActForms', state);
                });

                solo.on('training.actionLocation', function (index) {
                    // old: on_set_operation_viewpoint(n)
                    if (solo.training.playMode != solo.training.MODE_PLAY) {
                        if (solo.training.expected[index].animation) {
                            var substeps = solo.training.expected[index].animation.substeps;
                            solo.app.procedure.setPlayableItemList(substeps);
                            solo.app.procedure.seekToSubstep(substeps[0], solo.app.procedure.SEEK_TO_CUE_POINT);
                        }
                    }
                });

                solo.dispatch("core.didChangeLayout");

                solo.training.sco.loadPage();

                window.addEventListener('beforeunload', function () {
                    solo.training.sco.unloadPage();
                });

                if (typeof state.options.fixedMode !== 'undefined') {
                    solo.once('uniview.doc.didLoadComplete', function () {
                        solo.dispatch('training.activate', state.options.fixedMode);
                    });
                }

                skin.create(uiTrainingKeymap, options);
            });
    };

});

/**
 * The event is fired when the setting value changes.
 * @event Cortona3DSolo~"uniview.settings.changedHighlightParts"
 * @type {boolean}
 */
/**
 * The event is fired when the setting value changes.
 * @event Cortona3DSolo~"uniview.settings.changedContinuousMode"
 * @type {boolean}
 */
/**
 * The event is fired when the setting value changes.
 * @event Cortona3DSolo~"uniview.settings.changedDirectHints"
 * @type {boolean}
 */

/**
 * Returns the title of the training scenario. 
 * 
 * @callback module:uniview-training~getScenarioTitle
 * @param {HTMLElement} documentElement The root element of the loaded data module
 * @returns {string}
 */