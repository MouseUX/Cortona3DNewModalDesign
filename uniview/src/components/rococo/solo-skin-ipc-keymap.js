define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {

        var index = 0,
            ipc = solo.app.ipc,
            settings = solo.uniview.settings,
            sheets = solo.app.modelInfo.sheets;

        function keyHome(context) {
            solo.dispatch('app.ipc.didSelectSheet', sheets[index]);
            solo.app.ipc.resetCurrentSheet(true);
        }

        var keymap = skin.create(require('components/keymap'), solo.expand({
            '0000:112': function (context) { // F1
                if (typeof options.helpAction == 'function') {
                    options.helpAction();
                }
            },
            '0000:34': function (context) { // page down
                index = Math.min(index + 1, sheets.length - 1);
                ipc.setCurrentSheet(sheets[index].id, !settings.SkipAnimation);
            },
            '0000:33': function (context) { // page up
                index = Math.max(index - 1, 0);
                ipc.setCurrentSheet(sheets[index].id, !settings.SkipAnimation);
            },
            '0000:32': function (context) { // space
                settings.DrawingDisplayMode = !settings.DrawingDisplayMode;
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
            '0000:36': keyHome, // home
            '0000:82': keyHome, // R
            '0010:70': function (context) { // F + shift
                settings.FullTable = !settings.FullTable;
            },
            '0010:65': function (context) { // A + shift
                if (context.isCanvasVisible) {
                    settings.SkipAnimation = !settings.SkipAnimation;
                }
            },
            '0010:69': function (context) { // E + shift
                if (context.isCanvasVisible) {
                    settings.SurfaceEdges = !settings.SurfaceEdges;
                }
            },
            '0010:84': function (context) { // T + shift
                if (context.isCanvasVisible) {
                    settings.IgnoreTransparency = !settings.IgnoreTransparency;
                }
            },
            '0010:48': function (context) { // 0 + shift
                if (context.isCanvasVisible) {
                    settings.SheetTransitionRate = 1;
                }
            },
            '0010:49': function (context) { // 1 + shift
                if (context.isCanvasVisible) {
                    settings.SheetTransitionRate = 0.5;
                }
            },
            '0010:50': function (context) { // 2 + shift
                if (context.isCanvasVisible) {
                    settings.SheetTransitionRate = 2;
                }
            },
            '0010:51': function (context) { // 3 + shift
                if (context.isCanvasVisible) {
                    settings.SheetTransitionRate = 4;
                }
            },
            '1000:80': function (context) { // P + ctrl
                if (solo.uniview.options.SpecClass === "IPC") {
                    require('actions/print-composite').print(options);
                } else {
                    require('actions/print-graphics').print(options);
                }
            },
            '1010:80': function (context) { // P + ctrl + shift
                if (solo.uniview.options.SpecClass === "IPC") {
                    require('actions/print-graphics').print(options);
                } else {
                    require('actions/print-graphics').print(options);
                }
            },
            '1100:80': function (context) { // P + ctrl + alt
                if (solo.uniview.options.SpecClass === "IPC") {
                    require('actions/print-dpl').print(options);
                } else {
                    require('actions/print-graphics').print(options);
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

        solo.on('app.ipc.didSelectSheet', keymap.prohibitKeyboardFocus);

        keymap.prohibitKeyboardFocus();
    };
});