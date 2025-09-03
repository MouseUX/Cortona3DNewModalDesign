define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {

        var index = 0,
            settings = solo.uniview.settings,
            viewpoints = solo.app.getViewpoints().filter(function (vp) {
                return vp.description;
            });

        var keymap = skin.create(require('components/keymap'), solo.expand({
            '0000:112': function (context) { // F1
                if (typeof options.helpAction == 'function') {
                    options.helpAction();
                }
            }, 
            '0000:34': function (context) { // page down
                index = Math.min(index + 1, viewpoints.length - 1);
                if (index >= 0) {
                    solo.app.activeViewpoint = viewpoints[index].handle;
                }
            },
            '0000:33': function (context) { // page up
                index = Math.max(index - 1, 0);
                if (viewpoints.length) {
                    solo.app.activeViewpoint = viewpoints[index].handle;
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
                }
            },
            '0000:70': function (context) { // F
                if (context.isCanvasVisible) {
                    solo.app.fitSceneInView(true, options.fitSceneFactor);
                }
            },
            '0000:82': function (context) { // R
                if (context.isCanvasVisible) {
                    solo.app.setDefaultView(true);
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
            '0010:69': function (context) { // E + shift
                if (context.isCanvasVisible) {
                    settings.SurfaceEdges = !settings.SurfaceEdges;
                }
            },
            '1100:65': function (context) { // A + alt + ctrl
                if (context.isCanvasVisible) {
                    solo.app.antialiasing = !solo.app.antialiasing;
                }
            },
            '1100:79': function (context) { // O + alt + ctrl
                if (context.isCanvasVisible) {
                    solo.app.ambientOcclusion = !solo.app.ambientOcclusion;
                }
            },
            '1100:88': function (context) { // X + alt + ctrl
                if (context.isCanvasVisible) {
                    solo.app.selectionMode = solo.app.selectionMode === solo.app.SELECTION_MODE_XRAY ? solo.app.SELECTION_MODE_DEFAULT : solo.app.SELECTION_MODE_XRAY;
                }
            },
            '1100:83': function (context) { // S + alt + ctrl
                if (context.isCanvasVisible) {
                    solo.app.selectionMode = solo.app.selectionMode === solo.app.SELECTION_MODE_TRANSLUCENT_SHELL ? solo.app.SELECTION_MODE_DEFAULT : solo.app.SELECTION_MODE_TRANSLUCENT_SHELL;
                }
            },
            '1100:72': function (context) { // H + alt + ctrl
                if (context.isCanvasVisible) {
                    solo.app.outlineHoveredObjects = !solo.app.outlineHoveredObjects;
                }
            }
        }, options.keymap || {}));

        keymap.prohibitKeyboardFocus();
    };
});