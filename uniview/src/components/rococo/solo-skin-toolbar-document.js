/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop filterComponent {UISkinComponent}
 */
define(function (require, exports, module) {

    module.exports = function (skin, options, solo) {

        var i18n = solo.uniview.i18n.ui;

        var uiButtonExpand = require('./ui/btn-expand'),
            uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var uiFaultButtons = require('components/rococo/solo-skin-toolbar-fault');

        var buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
            panelName: 'Aux'
        }).$el;

        var container = skin.container('.right');

        if (solo.uniview.metadata.SCHEMA === 'fault') {
            var showByStepsButton = skin.create(uiFaultButtons, options);
            container.append(showByStepsButton);
        }

        if (options.filterComponent && !options.filterComponent.isEmpty) {
            var filterButton = skin.create(uiSettingsItem, {
                type: 'button',
                name: 'ShowFilter',
                label: i18n.filter,
                title: i18n.titleFilter,
                onchange: function (value) {
                    options.filterComponent.emit('toggle', value);
                }
            });
            
            container.append(filterButton);

            options.filterComponent.on('closed', function () {
                solo.uniview.settings.ShowFilter = false;
            });

            solo.on('uniview.doc.filter.setDocumentFilterState', function (state) {
                if (state) {
                    filterButton.disabled = false;
                } else {
                    filterButton.disabled = true;
                    solo.uniview.settings.ShowFilter = false;
                }
            });

            if (options.pctFilter) {
                filterButton.disabled = true;
            }
        }

        container.append(buttonExpand);

        var element = skin.toolbar('.main.top',
            skin.container('.left'),
            container
        );

        return this.exports(element);
    };
});