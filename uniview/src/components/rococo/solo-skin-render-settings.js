/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop hideNavigationCubeSetting {boolean}
 * @prop hideNavigationSchemeSetting {boolean}
 * @prop hideSurfaceEdgesSetting {boolean}
 * @prop hideAntiAliasingSetting {boolean}
 * @prop hideAmbientOcclusionSetting {boolean}
 * @prop hideSelectionModeSetting {boolean}
 * @prop hideOutlineHoveredObjectsSetting {boolean}
 * @prop hideSceneLightingSetting {boolean}
 * @prop sceneLightingSettingChoice {object[]}
 * @prop sceneLightingPresets {LightingConfig[][]}
 */
define(function (require, exports, module) {

    module.exports = function (skin, options, solo) {
        var cubeSettings = skin.create(require('components/rococo/solo-skin-cube-settings')),
            sceneLightingPresets = options.sceneLightingPresets || solo.app.lightingPresets || require('lib/scene-lighting');

        var sceneBoundBox = require('lib/scene-bbox');

        var i18n = solo.expand(
            solo.uniview.i18n['solo-skin-procedure-settings-panel'] || {},
            solo.uniview.i18n['settings'] || {},
            cubeSettings.i18n
        );

        var navigationCubeSetting = !solo.app.navigationCube ? [] : [{
            name: 'NavigationCube',
            label: i18n.navigationCube,
            value: solo.app.navigationCube.visible,
            hidden: options.hideNavigationCubeSetting,
            onchange: function (value) {
                solo.app.navigationCube.visible = value;
            }
        }, {
            name: 'NavigationScheme',
            label: i18n.navigationScheme,
            type: 'select',
            value: 0,
            hidden: options.hideNavigationSchemeSetting,
            choice: [{
                value: 0,
                description: i18n.navigationSchemeDefault
            }, {
                value: 1,
                description: i18n.navigationSchemeAircraft
            }, {
                value: 2,
                description: i18n.navigationSchemeMultiview
            }],
            onchange: function (value) {
                var cube = solo.app.navigationCube;
                switch (+value) {
                    case 1: // aircraft
                        cubeSettings.optionAircraft();
                        break;
                    case 2: // multiview projections
                        cubeSettings.optionMultiviewProjection();
                        break;
                    default:
                        cubeSettings.optionDefault();
                }
            }
        }];
        function handlerSelectedObjectsCenterRotation() {
            var selected = solo.app.getSelectedObjects();
            if (selected.length) {
                var bbox = sceneBoundBox(solo, selected),
                    d2 = solo.app.project(bbox.center),
                    W = Cortona3DSolo.core.canvas.clientWidth,
                    H = Cortona3DSolo.core.canvas.clientHeight;
                    center = (!d2 || d2[0]<0 || d2[1]<0 || d2[0]>W || d2[1]>H);
                if (!d2) {
                    solo.app.fitObjectsInView(selected, true);
                } else {
                    solo.app.setRotationCenterToObjects(selected, center);
                }
            }
        }        
        return !solo.uniview.with3D ? [] : [{
            name: 'SceneLighting',
            label: i18n.sceneLighting,
            type: 'select',
            value: 0,
            hidden: options.hideSceneLightingSetting,
            choice: options.sceneLightingSettingChoice || [{
                value: 0,
                description: i18n.sceneLightingDefault
            }, {
                value: 1,
                description: i18n.sceneLighting1
            }, {
                value: 2,
                description: i18n.sceneLighting2
            }, {
                value: 3,
                description: i18n.sceneLighting3
            }, {
                value: 4,
                description: i18n.sceneLighting4
            }, {
                value: 5,
                description: i18n.sceneLighting5
            }, {
                value: 6,
                description: i18n.sceneLighting6
            }],
            onchange: function (value) {
                solo.app.lightingConfig = sceneLightingPresets[value];
            }
        }]
            .concat(navigationCubeSetting)
            .concat([{
                name: 'ShowSurfaceEdges',
                label: i18n.labelShowSurfaceEdges,
                value: solo.app.edgeColorWeights && solo.app.edgeColorWeights.some(function (n) { return n !== 0; }),
                hidden: (solo.uniview.options.ShowSurfaceEdges === false) || options.hideSurfaceEdgesSetting,
                disabled: !solo.uniview.options.KeepSurfaceEdges,
                onchange: function (value) {
                    solo.app.edgeColorWeights = [value ? 1 : 0, 0, 0];
                }
            }, {
                name: "AntiAliasing",
                label: i18n.antiAliasing,
                value: solo.app.antialiasing,
                hidden: options.hideAntiAliasingSetting,
                onchange: function (value) {
                    solo.app.antialiasing = value;
                }
            }, {
                name: "AmbientOcclusion",
                label: i18n.ambientOcclusion,
                value: solo.app.ambientOcclusion,
                hidden: options.hideAmbientOcclusionSetting,
                onchange: function (value) {
                    solo.app.ambientOcclusion = value;
                }
            }, {
                name: 'SelectionMode',
                label: i18n.selectionMode,
                type: 'select',
                value: solo.app.selectionMode,
                hidden: options.hideSelectionModeSetting,
                choice: [{
                    value: solo.app.SELECTION_MODE_DEFAULT,
                    description: i18n.default
                }, {
                    value: solo.app.SELECTION_MODE_XRAY,
                    description: i18n.xRay
                }, {
                    value: solo.app.SELECTION_MODE_TRANSLUCENT_SHELL,
                    description: i18n.translucentShell
                }],
                onchange: function (value) {
                    solo.app.selectionMode = value;
                }
            }, {
                name: "OutlineHoveredObjects",
                label: i18n.outlineHoveredObjects,
                value: solo.app.outlineHoveredObjects,
                hidden: options.hideOutlineHoveredObjectsSetting,
                onchange: function (value) {
                    solo.app.outlineHoveredObjects = value;
                    solo.app.drawHoveredObjectsAsSelected = !value;
                }
            }, {
                name: "SelectedObjectsCenterRotation",
                label: i18n.selectedObjectsCenterRotation,
                value: false,
                hidden: !options.showSelectedObjectsCenterRotation,
                onchange: function (value) {
                    solo.removeListener('app.didChangeSelectedObjects', handlerSelectedObjectsCenterRotation);
                    if (value) {
                        solo.on('app.didChangeSelectedObjects', handlerSelectedObjectsCenterRotation);
                        handlerSelectedObjectsCenterRotation();
                    }
                }
            }
        ]);
    };
});
