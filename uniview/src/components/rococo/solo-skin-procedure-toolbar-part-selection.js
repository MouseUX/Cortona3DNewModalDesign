/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop ignoreTransparency {boolean}
 * @prop animated {boolean}
 * @prop fitObjectFactor {number}
 * @prop selectByDocID {boolean}
 * @prop disableScreenTip {boolean}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-toolbar-part-selection.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.expand({}, solo.uniview.i18n['solo-skin-ipc-toolbar-part-selection'], solo.uniview.i18n['solo-skin-ipc-toolbar']);

        var m_animated = true;

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var doc = solo.uniview.doc;
        if (doc.type !== "procedure") return;

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
                        solo.app.toggleObjectsVisibility(solo.app.getSelectedObjects(), true);
                        checkShowAllVisibility();
                    }
                }),
                skin.buttonImg({
                    id: 'btn-selection-hide',
                    title: i18n.hide,
                    onclick: function () {
                        solo.app.toggleObjectsVisibility(solo.app.getSelectedObjects(), false);
                        checkShowAllVisibility();
                    }
                }),
                skin.buttonImg({
                    id: 'btn-select-none',
                    title: i18n.titleSelectNone,
                    onclick: function () {
                        solo.app.setSelectedObjects([], m_animated);
                    }
                })),
            skin.container('.right',
                skin.label('', i18n.labelTransparency),
                rangeTransparency
            )
        );

        var showAll =  skin.buttonImg({
            id: 'btn-show-all',
            title: i18n.showAll,
            className: 'disabled',
            onclick: function () {
                solo.app.restoreObjectProperty(0, solo.app.PROPERTY_TRANSPARENCY, m_animated);
                solo.app.restoreObjectProperty(0, solo.app.PROPERTY_VISIBILITY, m_animated);
                solo.app.setSelectedObjects([], m_animated);
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
                    value: false,
                    onchange: function (value) {
                        if (value) {
                            solo.dispatch('uniview.external3DPanel.show');
                        } else {
                            solo.dispatch('uniview.external3DPanel.hide');
                        }
                    }
                }) : '',
            skin.create(uiSettingsItem, {
                type: 'buttonImg',
                id: "btn-ignore-transparency",
                label: i18n.titleIgnoreTransparency,
                name: 'IgnoreTransparency',
                value: !!options.ignoreTransparency,
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

        solo.on('uniview.didReset', checkShowAllVisibility);

        function checkToolbarVisibility() {
            var selected = solo.app.getSelectedObjects();
            if (selected.length) {
                if (rangeTransparency.disabled || selected.length === 1) {
                    var value = solo.app.getObjectsTransparency(selected);
                    rangeTransparency.value = value * (rangeTransparency.max - rangeTransparency.min);
                    container.classList.remove('disabled');
                    rangeTransparency.disabled = false;
                }
                if (selected.length > 1) {
                    rangeTransparency.onchange.call(rangeTransparency);
                }
            } else {
                container.classList.add('disabled');
                rangeTransparency.disabled = true;
                rangeTransparency.value = 0;
            }
            solo.dispatch('core.didChangeLayout');
        }

        solo.on('app.didChangeSelection', checkToolbarVisibility);
        solo.on('app.didChangeSelectedObjects', checkToolbarVisibility);

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            skin.toggle(element, !drawingMode);
        });

        if (options.selectByDocID) {
            solo.on('procedure.didObjectEnter', function (docId) {
                if (!options.disableScreenTip) solo.core.canvas.parentNode.title = ixml.getDocItemInfo(docId).screentip || '';
                solo.app.procedure.hoverItem(docId, true, m_animated);
            });

            solo.on('procedure.didObjectOut', function (docId) {
                if (!options.disableScreenTip) solo.core.canvas.parentNode.title = '';
                solo.app.procedure.hoverItem(docId, false, m_animated);
            });

            solo.on('procedure.didObjectClick', function (docId, x, y, button, key, event) {
                if (solo.uniview.settings.SetCenter) return;
                if (button !== 1) return;
                if (key & ~2 !== 0) return;
                var handles = ixml.getObjectNamesByDocId(docId).map(solo.app.getObjectWithName);
                if (key & 2) {
                    var selected = solo.app.getSelectedObjects();
                    var isSelected = selected.some(function (handle) {
                        return handles.some(function (h) {
                            return h === handle;
                        });
                    });
                    if (isSelected) {
                        solo.app.removeSelectedObjects(handles, m_animated);
                    } else {
                        solo.app.addSelectedObjects(handles, m_animated);
                    }
                    rangeTransparency.onchange.call(rangeTransparency);
                } else {
                    solo.app.setSelectedObjects([], false);
                    solo.app.setSelectedObjects(handles, m_animated);
                }
            });
        } else {
            solo.on('touch.didObjectEnter', function (handle) {
                if (!handle) return;
                solo.app.procedure.hoverObject(handle, true, m_animated);
            });

            solo.on('touch.didObjectOut', function (handle) {
                if (!handle) return;
                solo.app.procedure.hoverObject(handle, false, m_animated);
            });

            solo.on('touch.didObjectClick', function (handle, name, x, y, button, key, event) {
                if (solo.uniview.settings.SetCenter) return;
                if (!handle || button !== 1) return;
                if (key & ~2 !== 0) return;
                if (key & 2) {
                    var selected = solo.app.getSelectedObjects();
                    var isSelected = selected.some(function (h) {
                        return h === handle;
                    });
                    if (isSelected) {
                        solo.app.removeSelectedObjects(handle, m_animated);
                    } else {
                        solo.app.addSelectedObjects(handle, m_animated);
                    }
                    rangeTransparency.onchange.call(rangeTransparency);
                } else {
                    solo.app.setSelectedObjects([], false);
                    solo.app.setSelectedObjects(handle, m_animated);
                }
            });
        }

        solo.on('touch.didObjectClick', function (handle, name, x, y, button, key, event) {
            if (button === 4 || (!handle && button === 1)) {
                solo.app.setSelectedObjects([], m_animated);
            }
        });

        function unselect() {
            solo.app.setSelectedObjects([]);
            solo.app.setHoveredObjects([]);
        }

        solo.on('app.procedure.didPlay', unselect);
        solo.on('app.procedure.didChangePlayerState', unselect);

        checkToolbarVisibility();

        return this.exports(element);
    };
});