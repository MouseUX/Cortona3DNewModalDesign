/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop fitObjectFactor {number}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-toolbar-part-selection.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.expand({}, solo.uniview.i18n['solo-skin-ipc-toolbar-part-selection'], solo.uniview.i18n['solo-skin-ipc-toolbar']);

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var m_isSelected,
            m_isDrawingMode,
            m_animated = true;

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        if (typeof options.animated === 'boolean') {
            m_animated = options.animated;
        }

        var rangeTransparency = skin.input({
            type: 'range',
            min: 0,
            max: 100,
            value: 0,
            onchange: function () {
                var value = this.value / (this.max - this.min);
                solo.app.setObjectsTransparency(solo.app.getSelectedObjects(), value, false);
                checkShowAllVisibility();
            }
        });

        rangeTransparency.oninput = rangeTransparency.onchange;

        var container = skin.container('.toolbar-part-selection-content',
            skin.container('.left',
                skin.buttonImg({
                    id: 'btn-selection-fit',
                    title: i18n.fit,
                    onclick: function () {
                        solo.app.fitSelectedObjectsInView(m_animated, options.fitObjectFactor);
                    }
                }),
                skin.buttonImg({
                    id: 'btn-selection-show',
                    title: i18n.show,
                    onclick: function () {
                        solo.app.ipc.selectedItems.forEach(function (row) {
                            solo.app.ipc.toggleItemVisibility(ixml.getIndexByRow(row), true);
                        });
                        checkShowAllVisibility();
                    }
                }),
                skin.buttonImg({
                    id: 'btn-selection-hide',
                    title: i18n.hide,
                    onclick: function () {
                        solo.app.ipc.selectedItems.forEach(function (row) {
                            solo.app.ipc.toggleItemVisibility(ixml.getIndexByRow(row), false);
                        });
                        checkShowAllVisibility();
                    }
                }),
                skin.buttonImg({
                    id: 'btn-select-none',
                    title: i18n.titleSelectNone,
                    onclick: function () {
                        solo.dispatch('app.ipc.didSelectItem', -1, []);
                    }
                })),
            skin.container('.right',
                skin.label('', i18n.labelTransparency),
                rangeTransparency
            )
        );

        var showAll = skin.buttonImg({
            id: 'btn-show-all',
            title: i18n.showAll,
            className: 'disabled',
            onclick: function () {
                solo.app.ipc.resetAllObjects();
                rangeTransparency.value = 0;
                this.classList.add('disabled');
            }
        });

        var element = skin.toolbar('#toolbar-part-selection.bottom',
                solo.uniview.options.AllowSelectedObjectsExternal3DView ?
                    skin.create(uiSettingsItem, {
                        type: 'buttonImg',
                        id: 'btn-selection-external-view',
                        label: i18n.titleSelectionExternalView,
                        name: 'SelectedObjectsExternalView',
                        value: false
                    }) : '',
                skin.create(uiSettingsItem, {
                    type: 'buttonImg',
                    name: 'IgnoreTransparency',
                    id: "btn-ignore-transparency",
                    value: (typeof options.ignoreTransparency === 'boolean') ? options.ignoreTransparency : true,
                    label: i18n.titleIgnoreTransparency,
                    onchange: function (value) {
                        solo.app.pickerTransparencyThreshold = value ? 0.0001 : 0.95;
                    }
                }),
                showAll,
                container
            );

        function checkShowAllVisibility() {
            var changed = solo.app.getObjectsWithDirtyProperty(solo.app.PROPERTY_TRANSPARENCY).concat(solo.app.getObjectsWithDirtyProperty(solo.app.PROPERTY_VISIBILITY));
            showAll.classList.toggle('disabled', !changed.length);
        }

        solo.on('catalog.didChangeHiddenItems', checkShowAllVisibility);
        
        function checkToolbarVisibility() {
            if (solo.app.ipc.selectedItems.length && !m_isDrawingMode) {
                if (rangeTransparency.disabled || solo.app.ipc.selectedItems.length === 1) {
                    var value = solo.app.getObjectsTransparency(solo.app.getSelectedObjects());
                    rangeTransparency.value = value * (rangeTransparency.max - rangeTransparency.min);
                    container.classList.remove('disabled');
                    rangeTransparency.disabled = false;
                }
                if (solo.app.ipc.selectedItems.length > 1) {
                    rangeTransparency.onchange.call(rangeTransparency);
                }
            } else {
                container.classList.add('disabled');
                rangeTransparency.disabled = true;
                rangeTransparency.value = 0;
            }
            solo.dispatch('core.didChangeLayout');
        }

        solo.on('catalog.didChangeSelection', checkToolbarVisibility);

        solo.on('app.ipc.didDrawingDisplayMode', function (drawingMode) {
            m_isDrawingMode = drawingMode;
            checkToolbarVisibility();
        });

        checkToolbarVisibility();

        return this.exports(element);
    };
});