/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop filter {object}
 * @prop disableExpandButton {boolean}
 * @prop helpAction {function}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-dpl-toolbar.css');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['solo-skin-ipc-dpl-toolbar'] || {};

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        var uiButtonExpand = require('./ui/btn-expand'),
            uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var containerFilters = '';

        if (options.filter) {
            containerFilters = skin.container('.right.ipc-filters.empty');
            options.filter.forEach(function (filter) {
                var name = filter.name,
                    values = filter.values.map(function (value) {
                        if (typeof value === 'object') {
                            return value;
                        }
                        // IE11 fix to assign select.value 
                        return {
                            description: '' + value,
                            value: '' + value
                        };
                    });
                if (filter.values.length === 0 || (filter.values.length === 1 && filter.values[0].value === '*')) return;
                solo.catalog.filter.create(filter);
                containerFilters.append(
                    skin.create(uiSettingsItem, {
                        label: filter.label,
                        type: 'select',
                        choice: values,
                        name: 'Filter' + name,
                        onchange: function (value) {
                            solo.catalog.filter.set(name, value);
                        }
                    })
                );
                containerFilters.classList.remove('empty');
            });
            if (options.filter.length) {
                solo.on('catalog.didChangeFilterValue', function (name, value) {
                    solo.uniview.settings['Filter' + name] = value; 
                });
            }
        }

        var buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
            panelName: 'Aux' 
        }).$el;

        var checkboxFullTable = skin.create(uiSettingsItem, {
            label: i18n.labelFullTable,
            id: '#label-full-table',
            name: 'FullTable',
            onchange: function (value) {
                solo.app.ipc.fullDPLMode = value;
            }
        });

        checkboxFullTable.classList.add('skin-container');

        var element = skin.toolbar('#toolbar-dpl.main',
            skin.container('.left',
                skin.buttonImg({
                    id: "btn-print-table",
                    title: i18n.titlePrintTable,
                    onclick: function () {
                        require('actions/print-dpl').print(options);
                    }
                }),
                skin.buttonImg({
                    id: "btn-composite-print",
                    title: i18n.titleCompPrint,
                    onclick: function () {
                        require('actions/print-composite').print(options);
                    }
                })
            ),
            containerFilters,
            skin.container('.right',
                checkboxFullTable,
                skin.buttonImg({
                    id: "btn-excel",
                    title: i18n.titleExport,
                    onclick: require('actions/catalog-export-to-csv').exportToCSV.bind(solo, options)
                }),
                (options.helpAction || '') && skin.buttonImg({
                    id: "btn-help",
                    title: i18n.titleHelp,
                    onclick: function () {
                        if (typeof options.helpAction === 'function') {
                            options.helpAction();
                        }
                    }
                }),
                buttonExpand
            )
        );

        if (options.filter) {
            solo.on('core.didChangeLayout', function () {
                if (element.clientWidth < 687) {
                    containerFilters.classList.add('wrap');
                } else {
                    containerFilters.classList.remove('wrap');
                }
            });
        }

        return this.exports(element);
    };
});