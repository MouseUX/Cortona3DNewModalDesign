/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop fitSceneFactor {number}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-toolbar-scene-navigation.css');

    module.exports = function (skin, options, solo) {
        var m_animated = true,
            i18n = solo.uniview.i18n['solo-skin-toolbar-scene-navigation'] || {};

        var doc = solo.uniview.doc,
            cube = solo.app.navigationCube;

        var components = options.components || {};

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item'),
            uiMeasureTool = components.uiMeasureTool === void 0 ? require('components/rococo/solo-skin-measure-tool') : components.uiMeasureTool,
            uiSectionPlane = components.uiSectionPlane === void 0 ? require('components/rococo/solo-skin-section-plane') : components.uiSectionPlane;

        var navigationButtons = ["Front", "Back", "Left", "Right", "Top", "Bottom", "Isometric"];

        if (solo.catalog) {
            solo.catalog.willObjectClick = function () {
                return !solo.uniview.settings.SetCenter;
            };
        }

        if (typeof options.animated === 'boolean') {
            m_animated = options.animated;
        }

        var containerRight = skin.container('.standard-views.right');

        navigationButtons.forEach(function (name, index) {
            var lcName = name.toLowerCase(),
                title = (cube && cube.buttons) ? cube.buttons[index].title : i18n['title' + name];
                button = skin.buttonImg({
                    id: 'btn-' + lcName,
                    title: title,
                    onclick: function () {
                        if (cube && cube.buttons) {
                            cube.fitSceneInView(cube.buttons[index].view, cube.ROLL_NONE, m_animated);
                        } else {
                            solo.app.jumpToStandardView(lcName === 'left' ? 'right' : (lcName === 'right' ? 'left' : lcName), m_animated);
                        }
                    }
                });
            containerRight.append(button);
        });

        if (cube) {
            solo.on('uniview.settings.changedNavigationScheme', function () {
                setTimeout(function () {
                    navigationButtons.forEach(function (name, index) {
                        var n = document.getElementById('btn-' + name.toLowerCase());
                        if (n && cube.buttons) {
                            n.title = cube.buttons[index].title;
                        }
                    });
                }, 0);
            });
        }

        var buttonCenter = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            id: 'btn-set-center',
            label: i18n.titleSetCenter,
            name: 'SetCenter'
        });

        var buttonToggleRotationCenter = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            id: 'btn-show-hide-rotation-center',
            label: i18n.titleRotationCenter,
            name: 'ShowRotationCenter',
            onchange: function (value) {
                solo.app.setRotationCenterVisibility(value);
            }
        });

        var buttonToggleAxes = (solo.uniview.options.ShowAxes === false || solo.uniview.doc.type === 'generic') ? '' : skin.create(uiSettingsItem, {
            type: 'buttonImg',
            id: 'btn-show-hide-axes',
            label: i18n.titleAxes,
            name: 'ShowAxes',
            value: solo.app.coordinateAxesVisible,
            onchange: function (value) {
                solo.app.coordinateAxesVisible = value;
            }
        });

        var view = solo.skin.get('view');
        var buttonMeasureTool = uiMeasureTool && solo.uniview.options.AllowMeasureTool ? view.create(uiMeasureTool, options) : '';
        var buttonSectionPlane = uiSectionPlane && solo.uniview.options.AllowCrossSectionTool ? view.create(uiSectionPlane, options) : '';

        var element = skin.toolbar('#toolbar-navigation.main.bottom',
            skin.container('.left.navigation-buttons',
                buttonCenter,
                buttonToggleRotationCenter,
                skin.buttonImg({
                    id: "btn-fit-all",
                    title: i18n.titleFitAll,
                    onclick: function () {
                        solo.app.fitSceneInView(m_animated, options.fitSceneFactor);
                    }
                }),
                solo.app.alignHorizon ? skin.buttonImg({
                    id: "btn-align",
                    title: i18n.titleAlign,
                    onclick: function () {
                        solo.app.alignHorizon(m_animated);
                    }
                }) : '',
                buttonToggleAxes,
                buttonMeasureTool,
                buttonSectionPlane
            ),
            containerRight
        );

        function didDrawingDisplayMode(drawingMode) {
            skin.toggle(element, !drawingMode);
        }

        solo.on('app.ipc.didDrawingDisplayMode', didDrawingDisplayMode);
        solo.on('app.procedure.didDrawingDisplayMode', didDrawingDisplayMode);

        solo.on('touch.didObjectClick', function (handle, name, x, y) {
            if (!solo.uniview.settings.SetCenter) return;
            if (solo.app.configureInstance(0, 0) & solo.app.DISABLE_DISCARDABLE_GEOMETRY_DATA && solo.app.setRotationCenterToPoint) {
                var obj = solo.app.pickObjectChain(x, y);
                if (obj) {
                    setTimeout(function () {
                        solo.app.setRotationCenterToPoint(obj.sceneCoord[0], obj.sceneCoord[1], obj.sceneCoord[2]);
                        if (m_animated) {
                            solo.app.centerRotationCenterInView(m_animated);
                        }
                        solo.uniview.settings.SetCenter = false;
                    }, 0);
                }
            } else if (handle) {
                setTimeout(function () {
                    solo.app.setRotationCenterToObjects([handle], m_animated);
                    solo.uniview.settings.SetCenter = false;
                }, 0);
            }
        });

        solo.on('app.procedure.didPlay', function () {
            containerRight.classList.add('disabled');
        });
        solo.on('app.procedure.didStop', function () {
            containerRight.classList.remove('disabled');
        });

        return this.exports(element);
    };
});