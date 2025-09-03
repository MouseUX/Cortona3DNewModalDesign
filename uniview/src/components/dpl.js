/**
 * The UI component that is used to display the DPL table.
 * @module components/dpl
 * @requires components/dpl-anchor-commands
 * @requires solo-uniview
 * @requires addons/catalog
 */
define(function (require, exports, module) {
    require('css!./dpl.css');

    var ensureVisible = require('lib/ensure-visible');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {boolean} [options.animated=true] Enables the animated transitions
     * @param {number} [options.fitObjectFactor]
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="dpl-container skin-container">
     *      <table class="dpl-table"></table>
     * </div>
     * ```
     * @fires Cortona3DSolo~"catalog.afterFilterApplyOnDPL"
     * @fires Cortona3DSolo~"app.ipc.didSelectSheet"
     * @fires Cortona3DSolo~"catalog.didChangeFilteredItems"
     * @listens Cortona3DSolo~"app.ipc.dpl.didSetupRow"
     * @listens Cortona3DSolo~"app.ipc.didChangeItemVisibility"
     * @listens Cortona3DSolo~"app.ipc.didDrawingDisplayMode"
     * @listens Cortona3DSolo~"catalog.didChangeFilteredItems"
     * @listens Cortona3DSolo~"catalog.didSelectItem"
     * @listens Cortona3DSolo~"app.ipc.didSelectSheet"
     * @listens Cortona3DSolo~"app.ipc.dpl.didSetupTable"
     * @listens Cortona3DSolo~"app.ipc.dpl.didHoverRow"
     * @listens Cortona3DSolo~"app.ipc.didSkipAnimation"
     * @listens Cortona3DSolo~"catalog.sheetChangeCompleted"
     * @tutorial component-usage
     * @tutorial component-dpl
     */
    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            m_animated = true,
            disableTextSelection = solo.uniview.options.DisableTextSelection || options.DisableTextSelection;

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        if (typeof options.animated === 'boolean') {
            m_animated = options.animated;
        }

        var element = skin.container('.dpl-container');

        if (!window.navigator || !window.navigator.msSaveOrOpenBlob) {
            // sticky table header is only used if it is not IE or Edge
            element.classList.add('dpl-header-sticky');
        }

        // prevent clicking when text is selected
        if (!disableTextSelection) {
            skin.create(require('./dpl-enable-selection'));
        }

        function checkGeometry(row) {
            var info = ixml.getItemInfo(row);
            return !!info.objectNames.length;
        }

        function checkHotspot(row) {
            return solo.app.drawing.hotspotExists(ixml.getItemByRow(row));
        }

        function isObjectVisible(row) {
            return !ixml.getObjectsNamesByRow(row)
                .map(solo.app.getObjectWithName)
                .every(function (handle) {
                    var code = solo.app.getObjectVisibility(handle);
                    return code && (code !== solo.app.OBJECT_VISIBILITY_TRANSPARENT);
                });
        }

        solo.on('app.ipc.dpl.didSetupRow', function (tr, index) {
            var row = ixml.getRowByIndex(index);
            // restore selection
            if (solo.app.ipc.selectedItems.indexOf(row) >= 0) {
                solo.app.ipc.dpl.selectRow(index, true);
            }
        });

        solo.on('app.ipc.didChangeItemVisibility', function (visibility, indexes) {
            indexes.forEach(function (index) {
                var input = document.getElementById('chk' + index);
                if (input) {
                    input.checked = visibility;
                }
            });
        });

        solo.on('app.ipc.didDrawingDisplayMode', function (drawingMode) {
            if (drawingMode) {
                skin.classList.add('display-mode-2d');
            } else {
                skin.classList.remove('display-mode-2d');
            }
        });

        solo.on('catalog.didChangeFilteredItems', function (filtered, prev) {
            prev.forEach(function (row) {
                var index = ixml.getIndexByRow(row);
                solo.app.ipc.dpl.toggleRow(index, true);
            });
            filtered.forEach(function (row) {
                var index = ixml.getIndexByRow(row);
                solo.app.ipc.dpl.toggleRow(index, false);
            });
            /**
             * The event is fired after the DPL filter is applied.
             * @event Cortona3DSolo~"catalog.afterFilterApplyOnDPL"
             */
            solo.dispatch('catalog.afterFilterApplyOnDPL');
        });

        solo.on('catalog.didSelectItem', function (index) {
            if (index >= 0) {
                var rowElement = document.getElementById('row' + index);
                ensureVisible(rowElement);
            }
        });

        // setup dpl table
        solo.on('app.ipc.didSelectSheet', function (sheet, fullDPLMode) {
            var cl = element.classList;

            if (!solo.app.ipc.fullDPLMode || !cl.contains('dpl-full')) {
                element.innerHTML = solo.app.ipc.dplTable;
            }

            var activeItems = ixml.getSheetInfo(sheet.id).items,
                isSheetChanged = solo.app.ipc.fullDPLMode !== fullDPLMode,
                enableGhostItems = solo.catalog && solo.catalog.options && solo.catalog.options.enableGhostItems;

            element.querySelectorAll('.dpl-table tbody tr[id]')
                .forEach(function (tr, index) {
                    var row = ixml.getRowByIndex(index),
                        info = ixml.getItemInfo(row),
                        div = document.getElementById('chk' + index),
                        withGeometry = checkGeometry(row),
                        disabledRow = activeItems.indexOf(row) < 0,
                        ghostRow = ixml.getSheetsForRow(row).length === 0;

                    if (solo.app.ipc.fullDPLMode) {
                        if (disabledRow) {
                            tr.classList.add('disabled');
                        } else {
                            tr.classList.remove('disabled');
                        }
                        if (ghostRow) {
                            tr.classList.add('ghost');
                            if (!enableGhostItems) {
                                skin.hide(tr, true);
                            }
                        }
                    }

                    // remove default visibility checkbox
                    if (div) {
                        div.parentNode.removeChild(div);
                    }

                    tr.classList.add('nil3d');

                    // wrap revision mark
                    var pre = tr.querySelector('td:first-child pre'),
                        innerText = pre.textContent,
                        escape = document.createElement('textarea');

                    function escapeHTML(html) {
                        escape.textContent = html;
                        return escape.innerHTML;
                    }

                    pre.innerHTML = innerText.split('').map(function (ch) {
                        if (ch === 'R') {
                            return '<span class="dpl-rev-mark"><span>' + ch + '</span></span>';
                        }
                        return escapeHTML(ch);
                    }).join('');

                    // append visibility checkbox
                    if (withGeometry) {
                        var input = pre.appendChild(document.createElement('input'));
                        input.id = 'chk' + index;
                        input.type = 'checkbox';
                        input.checked = isObjectVisible(row);
                        input.classList.add('dpl-row-checkbox');
                        input.onclick = function (event) {
                            event.stopPropagation();
                            solo.app.ipc.toggleItemVisibility(index, this.checked);
                        };
                        // fit item on double click
                        if (!options.disableDoubleClickToFitObjectDPL) {
                            tr.ondblclick = function (e) {
                                solo.app.ipc.fitItem(index, m_animated, options.fitObjectFactor);
                                e.preventDefault();
                                e.stopPropagation();
                            };
                        }
                        if (isSheetChanged) {
                            input.disabled = true;
                            if (!disabledRow && +info.metadata.Secondary) {
                                input.dataset.checked = 0;
                            }
                        }
                    }
                });

            if (!solo.app.ipc.fullDPLMode || !cl.contains('dpl-full')) {
                solo.app.ipc.dpl.setupTable(element.firstChild);
            }
        });

        solo.on('app.ipc.dpl.didSetupTable', function () {
            var filteredItems = solo.app.ipc.filteredItems;
            solo.dispatch('catalog.didChangeFilteredItems', filteredItems, filteredItems);
        });

        solo.on('app.ipc.dpl.didHoverRow', function (index) {
            if (index < 0) return;
            var row = ixml.getRowByIndex(index),
                cl = document.querySelector('.dpl-table tr#row' + index).classList,
                nil = solo.app.ui.isDrawingDisplayMode() ? !checkHotspot(row) : cl.contains('nil3d');

            if (nil) {
                cl.add('nil');
            } else {
                cl.remove('nil');
            }
        });

        solo.on('catalog.sheetChangeCompleted', function () {
            setTimeout(function () {
                // hide checkbox for items without geometry
                element.querySelectorAll('.dpl-table tbody tr[id]')
                    .forEach(function (tr, index) {
                        var row = ixml.getRowByIndex(index),
                            isFiltered = solo.app.ipc.filteredItems.indexOf(row) >= 0,
                            input = document.getElementById('chk' + index);

                        if (input) {
                            input.disabled = false;
                            if (typeof input.dataset.checked !== 'undefined') {
                                input.checked = !!+input.dataset.checked;
                                setTimeout(solo.app.ipc.toggleItemVisibility, 0, index, !!+input.dataset.checked);
                            } else if (!isFiltered) {
                                input.checked = isObjectVisible(row);
                            }
                            tr.classList.remove('nil3d');
                            if (tr.classList.contains('nil')) {
                                solo.dispatch('app.ipc.dpl.didHoverRow', index);
                            }
                        }
                    });
            }, 0);
        });

        solo.dispatch('app.ipc.didSelectSheet', doc.sheet);

        return this.exports(element);
    };
});

/**
 * It is used to enable animated transitions between IPC pages or camera positions.
 * @event Cortona3DSolo~"app.ipc.didSkipAnimation"
 * @type {boolean}
 */