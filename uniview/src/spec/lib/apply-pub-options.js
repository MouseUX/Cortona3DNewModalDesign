/**
 * :3DBackgroundColor
 * :3DSelectedColor
 * :Background3DColor
 * :2DSelectedColor
 * :2DHighLightColor
 * :SelectedHotspotColor
 * :ShowAxes
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var uniview = solo.uniview || {},
            pub = uniview.options || {};

        function isUndefined(s) {
            return typeof s === 'undefined';
        }

        // 3D options
        if (uniview.with3D) {
            var bgColors = [],
                selectionColor = solo.app.selectionColor,
                hoverColor = solo.app.hoverColor;
            // catalog
            if (pub['3DBackgroundColor']) bgColors = [String(pub['3DBackgroundColor'])];
            if (pub['3DSelectedColor']) selectionColor = String(pub['3DSelectedColor']);
            if (pub['3DHoverColor']) hoverColor = String(pub['3DHoverColor']);
            solo.app.selectionColor = selectionColor;
            solo.app.hoverColor = hoverColor;
            // procedure
            if (pub.Background3DColor) bgColors = [String(pub.Background3DColor)];
            // background gradient color
            if (pub.Gradient3DColor && bgColors.length) bgColors.push(String(pub.Gradient3DColor));
            // default 3D background
            if (bgColors.length) {
                solo.app.setDefaultBackgroundColors(bgColors);
            }
            // surface edges
            if (pub.KeepSurfaceEdges) {
                solo.app.edgeColorWeights = [1, 0, 0];
            }
            // use AUTOMATIC navigator options
            if (!pub.EnableZoomToRotationCenter) {
                solo.app.navigatorOptions |= solo.app.AUTOMATIC_ZOOM_ANCHOR;
            }
            if (pub.EnableSpinAroundPickPoint) {
                solo.app.navigatorOptions |= solo.app.AUTOMATIC_SPIN_CENTER;
            }
            // disable zoom scale limits
            if (!pub.EnableZoomScaleLimits) {
                solo.app.navigatorOptions |= solo.app.DISABLE_ZOOM_SCALE_LIMITS;
            }
            // axes
            if (typeof pub.ShowAxes === 'boolean') {
                solo.app.coordinateAxesVisible = pub.ShowAxes;
            }
            // default fit factor
            if (!isUndefined(pub.DefaultFitFactorObject)) {
                solo.app.defaultFitFactorObject = pub.DefaultFitFactorObject / 100;
            }
            if (!isUndefined(pub.DefaultFitFactorScene)) {
                solo.app.defaultFitFactorScene = pub.DefaultFitFactorScene / 100;
            }
            // anti-aliasing
            solo.app.antialiasing = true;
            solo.app.ambientOcclusion = false;

            // apply highlighting params
            var brightness = 20;
            if (!isUndefined(pub.BrightnessLevel)) {
                brightness = +pub.BrightnessLevel || 0;
            }
            solo.app.setObjectHighlightParams(solo.app.OBJECT_HIGHLIGHT_HOVERED, {
                diffuseColor: brightness ? '#000' : solo.app.ui.color(hoverColor).darken(30),
                diffuseBrightnessDelta: brightness ? brightness / 100 : -0.5,
                emissiveColor: brightness ? '#000' : hoverColor,
                emissiveBrightnessDelta: brightness ? brightness / 100 : -1
            });
            solo.app.setObjectHighlightParams(solo.app.OBJECT_HIGHLIGHT_SELECTED, {
                diffuseColor: selectionColor,
                diffuseBrightnessDelta: -1,
                emissiveColor: '#000',
                emissiveBrightnessDelta: -1
            });
            solo.app.setObjectHighlightParams(solo.app.OBJECT_HIGHLIGHT_SELECTED_HOVERED, {
                diffuseColor: brightness ? solo.app.ui.color(selectionColor).brighten(brightness).toString() : solo.app.ui.color(hoverColor).darken(30),
                diffuseBrightnessDelta: -1,
                emissiveColor: brightness ? solo.app.ui.color().brighten(brightness).toString() : hoverColor,
                emissiveBrightnessDelta: -1
            });

            skin.create(require('components/rococo/solo-skin-cube-settings')).optionDefault();

        } else {
            // always ignore KeepSurfaceEdges option in 2D only mode
            pub.KeepSurfaceEdges = false;
        }

        // 2D options
        if (solo.app.drawing) {
            // catalog
            if (pub['2DSelectedColor']) solo.app.drawing.selectionColor = String(pub['2DSelectedColor']);
            if (pub['2DHighLightColor']) solo.app.drawing.hoverColor = String(pub['2DHighLightColor']);
            // procedure
            if (pub.SelectedHotspotColor) solo.app.drawing.selectionColor = String(pub.SelectedHotspotColor);

            solo.app.drawing.selectionFillOpacity = pub['2DSelectedFillOpacity']  / 100;
        }

    };
});