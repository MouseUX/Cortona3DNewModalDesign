/**
 * :panelName
 * :id
 * :title
 */
define(function (require, exports, module) {
    require('css!./btn-expand.css');

    module.exports = function (skin, options, solo) {
        var uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var i18n = solo.uniview.i18n.ui || {},
            panel = options.panelName || 'Main',
            name = "Expand" + panel,
            element = skin.create(uiSettingsItem, {
                type: "buttonImg",
                name: name,
                id: options.id || 'btn-expand',
                label: options.title || i18n.expand,
                disabled: typeof options.disabled !== 'undefined' ? options.disabled : true,
                onchange: function (value) {
                    element.title = value ? options.title || i18n.collapse : options.title || i18n.expand;
                    solo.dispatch('uniview.toggle' + panel + 'PanelOnlyMode', value);
                }
            });

        element.classList.add('btn-expand');

        solo.on('uniview.showAllPanels', function () {
            solo.dispatch('uniview.settings.disable' + name, false);
        });

        solo.on('uniview.toggleMainPanelOnlyMode', function (flag) {
            if (panel !== 'Main' || !flag) {
                solo.dispatch('uniview.settings.disable' + name, false);
            }
        });

        solo.on('uniview.toggleAuxPanelOnlyMode', function (flag) {
            if (panel !== 'Aux' || !flag) {
                solo.dispatch('uniview.settings.disable' + name, false);
            }
        });

        return this.exports(element);
    };

});