define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var settings = solo.uniview.settings,
            procedure = solo.app.procedure,
            training = solo.training;

        var keymap = skin.create(require('components/keymap'), solo.expand({
            '0000:112': function (context) { // F1
                if (typeof options.helpAction == 'function') {
                    options.helpAction();
                }
            },
            '0000:27': function (context) { // esc
                if (context.isDrawingVisible && solo.uniview.with3D) {
                    procedure.toggleDrawingDisplayMode(false);
                }
            },
            '0000:35': function (context) { // end
                if (context.isCanvasVisible) {
                    if (procedure.played) {
                        procedure.setPlayPosition(procedure.duration, true);
                    }
                }
            },
            '0000:36': function (context) { // home
                if (context.isCanvasVisible) {
                    if (training.mode === training.MODE_DEMO || training.mode === training.MODE_STUDY) {
                        solo.dispatch('training.ui.stop');
                    }
                }
            },
            '0000:32': function (context) { // space
                if (context.isCanvasVisible) {
                    if (training.mode === training.MODE_DEMO || training.mode === training.MODE_STUDY) {
                        solo.dispatch(procedure.played ? 'training.ui.pause' : 'training.ui.play');
                    }
                }
            },
            '0000:34': function (context) { // page down
                if (context.isCanvasVisible) {
                    if (training.mode === training.MODE_DEMO || training.mode === training.MODE_STUDY) {
                        if (training.activeStep && training.activeStep.nextstep) {
                            solo.dispatch('training.ui.forward');
                        }
                    }
                }
            },
            '0000:33': function (context) { // page up
                if (context.isCanvasVisible) {
                    if (training.mode === training.MODE_DEMO || training.mode === training.MODE_STUDY) {
                        if (!training.history.isEmpty()) {
                            solo.dispatch('training.ui.backward');
                        }
                    }
                }
            },
            '0100:48': function (context) { // 0 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('isometric', true);
                }
            },
            '0100:49': function (context) { // 1 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('front', true);
                }
            },
            '0100:50': function (context) { // 2 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('back', true);
                }
            },
            '0100:51': function (context) { // 3 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('right', true);
                }
            },
            '0100:52': function (context) { // 4 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('left', true);
                }
            },
            '0100:53': function (context) { // 5 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('top', true);
                }
            },
            '0100:54': function (context) { // 6 + alt
                if (context.isCanvasVisible) {
                    solo.app.jumpToStandardView('bottom', true);
                }
            },
            '0000:65': function (context) { // A
                if (context.isCanvasVisible) {
                    solo.app.alignHorizon(true);
                }
            },
            '0000:67': function (context) { // C
                if (context.isCanvasVisible) {
                    settings.ShowRotationCenter = !settings.ShowRotationCenter;
                    solo.app.setRotationCenterVisibility(settings.ShowRotationCenter);
                }
            },
            '0000:70': function (context) { // F
                if (context.isCanvasVisible) {
                    solo.app.fitSceneInView(true, options.fitSceneFactor);
                }
            },
            '0000:88': function (context) { // X
                if (context.isCanvasVisible) {
                    if (solo.uniview.options.ShowAxes !== false) {
                        settings.ShowAxes = !settings.ShowAxes;
                    }
                }
            },
            '0000:82': function (context) { // R
                if (context.isCanvasVisible) {
                    procedure.freezeCamera(false);
                    solo.app.setDefaultView(true);
                    procedure.freezeCamera(settings.FreezeCamera);
                    solo.app.setSelectedObjects([], true);
                    solo.app.restoreObjectProperty(0, solo.app.PROPERTY_TRANSPARENCY, true);
                    solo.app.restoreObjectProperty(0, solo.app.PROPERTY_VISIBILITY, true);
                }
            },
            '0010:65': function (context) { // A + shift
                if (context.isCanvasVisible) {
                    settings.SkipAnimation = !settings.SkipAnimation;
                }
            },
            '0010:67': function (context) { // C + shift
                if (context.isCanvasVisible) {
                    settings.ContinuousMode = !settings.ContinuousMode;
                }
            },
            '0010:69': function (context) { // E + shift
                if (context.isCanvasVisible) {
                    settings.ShowSurfaceEdges = !settings.ShowSurfaceEdges;
                }
            },
            '0010:86': function (context) { // V + shift
                if (context.isCanvasVisible) {
                    settings.FreezeCamera = !settings.FreezeCamera;
                }
            },
            '0010:77': function (context) { // M + shift
                if (context.isCanvasVisible) {
                    settings.DisableAlertMessages = !settings.DisableAlertMessages;
                }
            },
            '0010:72': function (context) { // H + shift
                if (context.isCanvasVisible) {
                    settings.HighlightParts = !settings.HighlightParts;
                }
            },
            '0010:68': function (context) { // D + shift
                if (context.isCanvasVisible) {
                    settings.DirectHints = !settings.DirectHints;
                }
            },
            '0010:48': function (context) { // 0 + shift
                if (context.isCanvasVisible) {
                    settings.PlaybackSpeed = 1;
                }
            },
            '0010:49': function (context) { // 1 + shift
                if (context.isCanvasVisible) {
                    settings.PlaybackSpeed = 0.5;
                }
            },
            '0010:50': function (context) { // 2 + shift
                if (context.isCanvasVisible) {
                    settings.PlaybackSpeed = 2;
                }
            },
            '0010:51': function (context) { // 3 + shift
                if (context.isCanvasVisible) {
                    settings.PlaybackSpeed = 4;
                }
            },
            '1100:65': function (context) { // A + alt + ctrl
                if (context.isCanvasVisible) {
                    settings.AntiAliasing = !settings.AntiAliasing;
                }
            },
            '1100:79': function (context) { // O + alt + ctrl
                if (context.isCanvasVisible) {
                    settings.AmbientOcclusion = !settings.AmbientOcclusion;
                }
            },
            '1100:88': function (context) { // X + alt + ctrl
                if (context.isCanvasVisible) {
                    settings.SelectionMode = settings.SelectionMode === solo.app.SELECTION_MODE_XRAY ? solo.app.SELECTION_MODE_DEFAULT : solo.app.SELECTION_MODE_XRAY;
                }
            },
            '1100:83': function (context) { // S + alt + ctrl
                if (context.isCanvasVisible) {
                    settings.SelectionMode = settings.SelectionMode === solo.app.SELECTION_MODE_TRANSLUCENT_SHELL ? solo.app.SELECTION_MODE_DEFAULT : solo.app.SELECTION_MODE_TRANSLUCENT_SHELL;
                }
            },
            '1100:72': function (context) { // H + alt + ctrl
                if (context.isCanvasVisible) {
                    settings.OutlineHoveredObjects = !settings.OutlineHoveredObjects;
                }
            }
        }, options.keymap || {}));

        keymap.prohibitKeyboardFocus();

    };
});