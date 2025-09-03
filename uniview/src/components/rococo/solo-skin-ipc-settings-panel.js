/**
 * =@uniview.settings.changedSettings
 */
/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop enableAutoHide {boolean}
 * @prop customSettings {HTMLContent}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-settings-panel.css');

    var uiPopup = require('components/popup'),
        uiSettingsItem = require('components/rococo/solo-skin-settings-item');

    module.exports = function (skin, options, solo) {

        if (!solo.uniview.settings) {
            solo.uniview.settings = {};
        }

        var i18n = solo.uniview.i18n['solo-skin-ipc-settings-panel'] || {},
            renderSettings = skin.create(require('components/rococo/solo-skin-render-settings'), options),
            popup = skin.create(uiPopup, {
                closable: true,
                content: (!solo.uniview.with3D ? [] : [{
                    name: 'SheetTransitionRate',
                    label: i18n.labelSheetTransitionRate,
                    type: 'select',
                    value: 1,
                    hidden: options.hideSheetTransitionRate,
                    choice: [{
                        value: 0.5,
                        description: "⨯½"
                    },
                    {
                        value: 1,
                        description: "⨯1"
                    },
                    {
                        value: 2,
                        description: "⨯2"
                    },
                    {
                        value: 4,
                        description: "⨯4"
                    },
                    {
                        value: 8,
                        description: "⨯8"
                    },
                    {
                        value: 16,
                        description: "⨯16"
                    }
                    ],
                    onchange: function (value) {
                        solo.app.ipc.sheetTransitionRate = +value || 1;
                    }
                }, {
                    name: 'TransitionAnimationControl',
                    label: i18n.labelTransitionAnimationControl,
                    hidden: solo.uniview.options.HideTransitionAnimationControlCheckbox || options.disableTransitionAnimationControl,
                }, {
                    name: 'BackgroundObjectsRenderingMode',
                    label: i18n.labelBackgroundObjectsRenderingMode,
                    type: 'select',
                    value: solo.app.GEOMETRY_RENDERING_DEFAULT,
                    hidden: !options.showBackgroundObjectsRenderingModeSetting,
                    choice: [{
                        value: solo.app.GEOMETRY_RENDERING_DEFAULT,
                        description: i18n.backgroundObjectsRenderingModeDefault
                    }, {
                        value: solo.app.GEOMETRY_RENDERING_XRAY,
                        description: i18n.backgroundObjectsRenderingModeXRay
                    }, {
                        value: solo.app.GEOMETRY_RENDERING_TRANSLUCENT_SHELL,
                        description: i18n.backgroundObjectsRenderingModeTranslucentShell
                    }],
                    onchange: function (value) {
                        solo.app.backgroundGeometryRenderingMode = +value;
                    }
                }])
                    .concat(options.auxSettings || [])
                    .concat(renderSettings.length ? [skin.create('hr')].concat(renderSettings) : [])
                    .concat(options.customSettings || [])
                    .filter(function (item) {
                        return item;
                    })
                    .map(function (item) {
                        if (!(item instanceof Node)) {
                            var hideOptionName = 'Hide' + item.name + 'Option';
                            if (typeof item.hidden === 'undefined' && typeof solo.uniview.options[hideOptionName] !== 'undefined') {
                                item.hidden = !!solo.uniview.options[hideOptionName];
                            }
                        }
                        return item;
                    })
                    .map(function (item) {
                        var el = (item instanceof Node) ? item : skin.create(uiSettingsItem, item);
                        el.classList.add('panel-settings-item');
                        if (el.querySelector('input[type="checkbox"], input[type="radio"]')) {
                            el.classList.add('start');
                        }
                        return el;
                    })
            });

        popup.classList.add('panel-settings');

        solo.on('uniview.settings.changedSettings', function (flag) {
            popup.emit('toggle', flag);
            if (flag) {
                updateSceneLightingIcon(solo.uniview.settings.SceneLighting);
            }
        });

        var turnOffTimeout,
            turnOffSettingsPanel = function () {
                solo.uniview.settings.Settings = false;
            };

        solo.on('touch.didPointerDown', turnOffSettingsPanel);
        solo.on('app.procedure.didPlay', turnOffSettingsPanel);

        if (options.enableAutoHide) {
            popup.$el.onmouseout = function () {
                clearTimeout(turnOffTimeout);
                turnOffTimeout = setTimeout(turnOffSettingsPanel, 3000);
            };
            popup.$el.onmouseover = function () {
                clearTimeout(turnOffTimeout);
            };
            popup.on('closed', function () {
                clearTimeout(turnOffTimeout);
            });
        }

        popup.on('closed', function () {
            solo.uniview.settings.Settings = false;
            clearTimeout(turnOffTimeout);
        });

        solo.on('uniview.settings.changedSceneLighting', updateSceneLightingIcon);

        function updateSceneLightingIcon(value) {
            var node = document.querySelector('#options-scenelighting .label-control-select');
            if (node) {
                node.dataset.value = value;
            }
        }

        return popup;
    };
});
