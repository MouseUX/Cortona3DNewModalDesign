/**
 * =@uniview.settings.changedSettings
 */
/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableSpeed {boolean}
 * @prop disableFreeze {boolean}
 * @prop disableLock {boolean}
 * @prop disableMessages {boolean}
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

        var procedure = solo.app.procedure,
            i18n = solo.uniview.i18n['solo-skin-procedure-settings-panel'] || {},
            renderSettings = skin.create(require('components/rococo/solo-skin-render-settings'), options),
            popup = skin.create(uiPopup, {
                closable: true,
                content: (!solo.uniview.with3D ? [] : [{
                    name: 'PlaybackSpeed',
                    label: i18n.labelSpeed,
                    hidden: (solo.uniview.options.ShowSpeedSelection === false) || options.disableSpeed,
                    type: 'select',
                    value: +solo.uniview.options.PlaybackSpeed || 1,
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
                    }
                    ],
                    onchange: function (value) {
                        procedure.setPlaybackSpeed(+value || 1);
                    }
                },
                {
                    name: 'FreezeCamera',
                    label: i18n.labelFreezeViewpoint,
                    hidden: (solo.uniview.options.ShowFreezeCheckbox === false) || options.disableFreeze,
                    onchange: function (value) {
                        procedure.freezeCamera(value);
                    }
                },
                {
                    name: 'Locked',
                    label: i18n.labelLockStep,
                    hidden: (solo.uniview.options.ShowAutostopBox === false) || options.disableLock,
                    value: solo.uniview.options.EnableAutostop === true,
                    onchange: function (value) {
                        procedure.locked = value;
                    }
                },
                {
                    name: 'DisableAlertMessages',
                    label: i18n.labelDisableAlertMessages,
                    hidden: (solo.uniview.options.ShowMessagesBox === false) || options.disableMessages,
                    value: solo.uniview.options.EnableWarnings === false
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
                solo.uniview.settings.Locked = procedure.locked;
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

/**
 * @event Cortona3DSolo~"uniview.settings.changedSettings"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.setSettings"
 * @type {boolean}
 */

/**
 * @event Cortona3DSolo~"uniview.settings.setShowSurfaceEdges"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.setFreezeCamera"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.setLocked"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.setDisableAlertMessages"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.setPlaybackSpeed"
 * @type {number}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.changedShowSurfaceEdges"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.changedFreezeCamera"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.changedLocked"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.changedDisableAlertMessages"
 * @type {boolean}
 */
/**
 * @event Cortona3DSolo~"uniview.settings.changedPlaybackSpeed"
 * @type {number}
 */