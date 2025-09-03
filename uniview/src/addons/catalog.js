/**
 * The add-on module that combines the DPL table, 3D model, and 2D drawing.
 * 
 * Enables the support for:
 * - the Full DPL mode
 * - multiple selection of IPC items
 * - filtering of IPC items
 * - `multiLink` feature
 * - `keep3DStructure` feature
 * 
 * Adds {@link Cortona3DSolo.catalog} namespace.
 * 
 * @mixes Cortona3DSolo.app
 * @mixes Cortona3DSolo.app.ipc
 * @mixes Cortona3DSolo.app.ipc.interactivity
 * @mixes Cortona3DSolo.app.drawing
 * 
 * @see {@link Cortona3DSolo~event:"catalog.didHoverItem"}
 * @see {@link Cortona3DSolo~event:"catalog.didChangeHiddenItems"}
 * @see {@link Cortona3DSolo~event:"catalog.didSelectItem"}
 * @see {@link Cortona3DSolo~event:"catalog.didChangeSelection"}
 * @see {@link Cortona3DSolo~event:"catalog.didCallContextMenu"}
 * @see {@link Cortona3DSolo~event:"catalog.sheetChangeCompleted"}
 * @see {@link Cortona3DSolo~event:"catalog.didChangeFilteredItems"}
 * @see {@link Cortona3DSolo~event:"catalog.didChangeFilterValue"}
 * 
 * @module addons/catalog
 */

define(function (require, exports, module) {

    var solo = window.Cortona3DSolo,
        ipc = solo.app.ipc,
        ixml = ipc.interactivity;

    if (solo.catalog) {
        module.exports = solo.catalog;
        return;
    }

    if (!solo.core) {
        require('./catalog/no-core');
    } else {
        solo.app.configureInstance(solo.app.DISABLE_DOCUMENT_INTERACTIVITY);
    }

    var setOp = require('./catalog/set-op'),
        union = setOp.union,
        intersection = setOp.intersection,
        difference = setOp.difference;

    var DPL = require('./catalog/dpl-render');

    var m_fullDPLMode = false;
    var m_sheetTransition = false;

    var m_clickedHandle;

    /**
     * @namespace
     * @memberof Cortona3DSolo
     * @prop {object} options
     * @prop {boolean} options.enableGhostItems=false Processing the DPL rows that are not activated on any IPC page.
     * @prop {boolean} options.disableMultipleSelections=false Disables the selection of multiple DPL lines using the Ctrl and Shift key modifiers.
     * @requires module:addons/catalog
     */
    var catalog = {
        options: {
            enableGhostItems: false,
            disableMultipleSelections: false
        },
        /**
         * @namespace 
         */
        filter: require('./catalog/dpl-filter'),
        /**
         * Enables support of `multiLink` feature.
         * 
         * @method
         */
        useMultiLink: require('addons/catalog-multilink'),
        /**
         * Enables support of `keep3DStructure` feature.
         * 
         * @method
         */
        keep3DStructure: function () {
            if (solo.core) {
                solo.app.recursiveObjectLookup = true;
            }
        },
    };

    function getActiveIndex(row) {
        var res = -1;
        if (row >= 0) {
            if (ipc.isItemActive(row)) {
                return ixml.getIndexByRow(row);
            }
            return getActiveIndex(ixml.getParent(row));
        }
        return res;
    }

    function isGhostRow(row) {
        return ixml.getSheetsForRow(row).length === 0;
    }

    var objects = {};

    var selectedRows = [];
    var hiddenIndexes = [];
    var filteredRows = [];

    function drawSelectedObjects(row) {
        var handles = [];
        if (row >= 0) {
            var all = selectedRows.reduce(function (acc, row) {
                return union(acc, [row].concat(ixml.getChildren(row, true)));
            }, []);
            handles = all.reduce(function (acc, row) {
                return acc.concat(ixml.getObjectsNamesByRow(row));
            }, []).reduce(function (acc, name) {
                return acc.concat(solo.app.getObjectWithName(name) || []);
            }, []);
        }
        if (solo.app.recursiveObjectLookup && handles.length) {
            solo.app.setSelectedObjects([], false);
        }
        solo.app.setSelectedObjects(handles, !solo.app.recursiveObjectLookup);
    }

    function setObjectTransparency(name, value) {
        if (!(name in objects)) {
            objects[name] = {
                transparency: 0,
                visible: true
            };
        }
        objects[name].transparency = value;
    }

    function getObjectTransparency(name) {
        if (!(name in objects)) {
            objects[name] = {
                transparency: 0,
                visible: true
            };
        }
        return objects[name].transparency;
    }

    function resetObjectTransparency(name) {
        setObjectTransparency(name, 0);
    }

    function resetAllObjects(animated) {
        objects = {};
        resetHiddenIndexes();
        solo.app.restoreObjectProperty(0, solo.app.PROPERTY_TRANSPARENCY, animated);
        solo.app.restoreObjectProperty(0, solo.app.PROPERTY_VISIBILITY, animated);
        catalog.filter.resetAll();
    }

    function resetHiddenIndexes() {
        if (hiddenIndexes.length) {
            solo.dispatch('app.ipc.didChangeItemVisibility', true, hiddenIndexes);
        }
        hiddenIndexes = [];
        solo.dispatch('catalog.didChangeHiddenItems', hiddenIndexes);
    }

    function toggleItemVisibility(index, visible, preventNotification, deep) {
        var row = ixml.getRowByIndex(index),
            handles = ixml.getObjectsForRow(row, deep),
            indexesHidden = visible === false ? [index] : [],
            indexesVisible = visible === true ? [index] : [];

        handles.forEach(function (handle) {
            var visibility = (typeof visible === 'undefined') ? !solo.app.isObjectVisible(handle) : visible;
            var index = ixml.getIndexByRow(ixml.getRowByObjectName(solo.app.getObjectName(handle)));
            if (index >= 0 && indexesVisible.indexOf(index) < 0 && indexesHidden.indexOf(index) < 0) {
                (visibility ? indexesVisible : indexesHidden).push(index);
            }
            if (visibility) {
                solo.app.restoreObjectProperty(handle, solo.app.PROPERTY_VISIBILITY, false);
            } else {
                solo.app.setObjectPropertyf(handle, solo.app.PROPERTY_VISIBILITY, false, -1);
            }
        });

        if (!preventNotification) {
            if (indexesHidden.length) {
                solo.dispatch('app.ipc.didChangeItemVisibility', false, indexesHidden);
            }
            if (indexesVisible.length) {
                solo.dispatch('app.ipc.didChangeItemVisibility', true, indexesVisible);
            }
        }
    }

    var commands = {};

    ixml.json.$('ipc/figure/dplist/item').forEach(function (item) {
        item.$('commands/command').forEach(function (command) {
            commands[command.$attr('id')] = command;
        });
    });

    var getRowByIndex = ixml.getRowByIndex;
    var getIndexByRow = ixml.getIndexByRow;
    var resetCurrentSheet = ipc.resetCurrentSheet;
    var getChildren = ixml.getChildren;

    solo.use('drawing');
    solo.app.initialize();

    /**
     * Extended methods and properties of the namespace `Cortona3DSolo.app`.
     * 
     * @namespace app
     * @memberof Cortona3DSolo
     * @mixin
     */
    // expando app
    solo.expand(solo.app, {
        /**
         * Checks whether the object is visible, i.e. it is not hidden or transparent. 
         * 
         * @memberof Cortona3DSolo.app
         * @method
         * @param {Handle} handle
         * @returns {boolean}
         * @requires addons/catalog
         */
        isObjectVisible: function (handle) {
            var hidden = solo.app.getObjectsWithDirtyProperty(solo.app.PROPERTY_VISIBILITY) || [];
            return hidden.indexOf(handle) === -1;
        },
        /**
         * Checks whether the selected objects are visible (not hidden and not transparent).
         * 
         * @memberof Cortona3DSolo.app
         * @method
         * @returns {boolean}
         * @requires addons/catalog
         */
        isSelectedObjectsVisible: function () {
            var handles = solo.app.getSelectedObjects() || [];
            var hidden = solo.app.getObjectsWithDirtyProperty(solo.app.PROPERTY_VISIBILITY) || [];
            return intersection(handles, hidden).length === 0;
        },
        /**
         * Toggles the visibility state for selected objects.
         * 
         * @memberof Cortona3DSolo.app
         * @method
         * @param {boolean} force
         * @returns {boolean}
         * @requires addons/catalog
         */
        toggleSelectedObjectsVisibility: function (visibility) {
            var handles = solo.app.getSelectedObjects() || [];
            var isVisible = typeof visibility === 'undefined' ? solo.app.isSelectedObjectsVisible() : !visibility;
            var indexes = [];
            handles.forEach(function (handle) {
                var index = ixml.getIndexByRow(ixml.getRowByObjectName(solo.app.getObjectName(handle)));
                if (index >= 0 && indexes.indexOf(index) < 0) {
                    indexes.push(index);
                }
                if (isVisible) {
                    solo.app.setObjectPropertyf(handle, solo.app.PROPERTY_VISIBILITY, false, -1);
                } else {
                    solo.app.restoreObjectProperty(handle, solo.app.PROPERTY_VISIBILITY, false);
                }
            });
            if (indexes.length) {
                solo.dispatch('app.ipc.didChangeItemVisibility', !isVisible, indexes);
            }
            return !isVisible;
        },
        /**
         * Sets the transparency for selected objects.
         * 
         * @memberof Cortona3DSolo.app
         * @method
         * @param {number} value
         * @param {boolean} animate
         * @requires addons/catalog
         */
        setSelectedObjectsTransparency: function (value, animate) {
            var objs = solo.app.getSelectedObjects() || [];
            objs.forEach(function (handle) {
                solo.app.setObjectPropertyf(handle, solo.app.PROPERTY_TRANSPARENCY, false, value);
                setObjectTransparency(solo.app.getObjectName(handle), value);
            });
        },
        /**
         * Gets the transparency value for selected objects.
         * 
         * @memberof Cortona3DSolo.app
         * @method
         * @returns {number}
         * @requires addons/catalog
         */
        getSelectedObjectsTransparency: function () {
            var objs = solo.app.getSelectedObjects() || [];
            return objs.reduce(function (acc, handle) {
                var def = solo.app.getObjectName(handle);
                return Math.max(getObjectTransparency(def), acc);
            }, 0);
        }
    });

    // expando app.ipc 

    /**
     * Extended methods and properties of the namespace `Cortona3DSolo.app.ipc`.
     * 
     * @namespace app.ipc
     * @memberof Cortona3DSolo
     * @mixin
     */

    /**
     * Gets or sets the state for the Full DPL mode.
     * 
     * @memberof Cortona3DSolo.app.ipc
     * @member {boolean} fullDPLMode
     * @requires addons/catalog
     */
    Object.defineProperty(ipc, 'fullDPLMode', {
        get: function () {
            return m_fullDPLMode;
        },
        set: function (flag) {
            if (m_fullDPLMode !== flag) {
                m_fullDPLMode = flag;
                solo.dispatch('app.ipc.didSelectSheet', ipc.getCurrentSheet(), m_fullDPLMode);
            }
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Checks if there is an animation of the sheet transition.
     * 
     * @memberof Cortona3DSolo.app.ipc
     * @member {boolean} sheetTransition
     * @requires addons/catalog
     */
    Object.defineProperty(ipc, 'sheetTransition', {
        get: function () {
            return m_sheetTransition;
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Gets an array of selected DPL rows.
     * 
     * @memberof Cortona3DSolo.app.ipc
     * @member {number[]} selectedItems
     * @readonly
     * @requires addons/catalog
     */
    Object.defineProperty(ipc, 'selectedItems', {
        get: function () {
            return Array.prototype.slice.call(selectedRows);
        },
        enumerable: true
    });

    /**
     * Gets an array of filtered DPL rows.
     * 
     * @memberof Cortona3DSolo.app.ipc
     * @member {number[]} filteredItems
     * @readonly
     * @requires addons/catalog
     */
    Object.defineProperty(ipc, 'filteredItems', {
        get: function () {
            return Array.prototype.slice.call(filteredRows);
        },
        enumerable: true
    });

    /**
     * Gets the HTML code for the DPL table.
     * 
     * @memberof Cortona3DSolo.app.ipc
     * @member {HTMLTableElement} dplTable
     * @readonly
     * @requires addons/catalog
     */
    Object.defineProperty(ipc, 'dplTable', {
        get: function () {
            var sheetInfo = ixml.getSheetInfo(ipc.currentSheetInfo.id);
            return (m_fullDPLMode ? DPL.getFullDPLTable(ixml.json) : DPL.getDPLTable(ixml.json, sheetInfo.items)) || '';
        },
        enumerable: true,
        configurable: true
    });

    // expando
    solo.expand(ipc, {
        /**
         * Selects the IPC page by its ID.
         * 
         * @async
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {string} sheetId
         * @param {boolean} animated
         * @returns {Promise.<CatalogCurrentSheetInfo>}
         * @requires addons/catalog
         */
        selectSheet: function (sheetId, animated) {
            if (sheetId === ipc.currentSheetInfo.id) {
                return Promise.resolve(ipc.currentSheetInfo);
            }
            return new Promise(function (resolve, reject) {
                solo.once('app.ipc.didSelectSheet', function (sheet) {
                    if (sheet.id === sheetId) {
                        resolve(sheet);
                    }
                });
                ipc.setCurrentSheet(sheetId, animated);
            });
        },
        /**
         * Adds the IPC page row with *index* row number to the selection.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @requires addons/catalog
         */
        addSelection: function (index) {
            var row = ixml.getRowByIndex(index);

            if (!ipc.isItemActive(row)) return;

            var i = selectedRows.indexOf(row);
            if (i < 0) {
                ipc.dpl.selectRow(index);
                solo.app.drawing.selectItem(index);
                selectedRows.push(row);

                drawSelectedObjects(row);
            }
        },
        /**
         * Removes the row of the IPC page from selection.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @requires addons/catalog
         */
        removeSelection: function (index) {
            var row = ixml.getRowByIndex(index);

            if (!ipc.isItemActive(row)) return;

            var i = selectedRows.indexOf(row);
            if (i >= 0) {
                ipc.dpl.selectRow(index, false);
                solo.app.drawing.selectItem(index, false);
                selectedRows.splice(i, 1);

                drawSelectedObjects(row);
            }
        },
        /**
         * Toggles the row of the IPC page in selection.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @param {boolean} [force]
         * @requires addons/catalog
         */
        toggleSelection: function (index, flag) {
            var row = ixml.getRowByIndex(index),
                i = selectedRows.indexOf(row);

            flag = (typeof flag === 'undefined') ? (i < 0) : flag;

            if (flag) {
                ipc.addSelection(index);
            } else {
                ipc.removeSelection(index);
            }
        },
        /**
         * Fit to the part defined by the *index* row number on the IPC page.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @param {boolean} animate
         * @param {number} [factor=0.95]
         * @requires addons/catalog
         */
        fitItem: function (index, animate, factor) {
            var row = ixml.getRowByIndex(index);
            var handles = ixml.getObjectsForRow(row);
            solo.app.fitObjectsInView(handles, animate, factor);
        },
        /**
         * Gets an array of the IPC item information object for all active items on the IPC page.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @returns {CatalogItemInfo[]}
         * @requires addons/catalog
         */
        getCurrentSheetItems: function () {
            var sheetId = ipc.getCurrentSheet().id;

            return ixml.getSheetInfo(sheetId).items.map(function (row) {
                return ixml.getItemInfo(row);
            });
        },
        /**
         * Checks if the item with the *row* number is active on the IPC page.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} row
         * @returns {boolean}
         * @requires addons/catalog
         */
        isItemActive: function (row) {
            var currentSheetId = ipc.getCurrentSheet().id;
            return currentSheetId && ixml.getSheetInfo(currentSheetId).items.indexOf(row) >= 0;
        },
        /**
         * Checks if the item with the *row* number is visible.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} row
         * @returns {boolean}
         * @requires addons/catalog
         */
        isItemVisible: function (row) {
            return hiddenIndexes.indexOf(ixml.getIndexByRow(row)) < 0;
        },
        /**
         * Makes all the active items on the IPC page visible.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {boolean} [animated]
         * @requires addons/catalog
         */
        restoreAllItemsVisibility: function (animated) {
            //solo.app.restoreObjectProperty(0, solo.app.PROPERTY_VISIBILITY, animated);
            hiddenIndexes.forEach(function (index) {
                toggleItemVisibility(index, true);
            });
            resetHiddenIndexes();
        }
    });

    // overwriting
    solo.expand(ipc, {
        /**
         * Highlights the IPC item in the 3D window, 2D drawing and DPL.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @requires addons/catalog
         * @fires Cortona3DSolo~"catalog.didHoverItem"
         */
        hoverItem: function (index) {
            var handles = ixml.getObjectsForRow(ixml.getRowByIndex(index));

            solo.app.setHoveredObjects(handles, true);

            ipc.dpl.hoverRow(index);
            solo.app.drawing.hoverItem(index);
            solo.dispatch('catalog.didHoverItem', index);
        },
        /**
         * Selects the IPC item in the 3D window, 2D drawing and DPL.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @requires addons/catalog
         */
        selectItem: function (index) {
            var row = ixml.getRowByIndex(index),
                isSelectOnlyClickedObject = solo.app.ipc.selectOnlyClickedObject && m_clickedHandle;

            if (!ipc.isItemActive(row)) {
                row = -1;
            }

            // clear selected
            selectedRows.forEach(function (row) {
                var index = ixml.getIndexByRow(row);
                ipc.dpl.selectRow(index, false);
                solo.app.drawing.selectItem(index, false);
            });

            selectedRows = (row < 0) ? [] : [row];

            // select
            var handles = isSelectOnlyClickedObject ? m_clickedHandle : ixml.getObjectsForRow(row);
            solo.app.setSelectedObjects(handles, !solo.app.recursiveObjectLookup);
            m_clickedHandle = null;

            selectedRows.forEach(function (row) {
                var index = ixml.getIndexByRow(row);
                ipc.dpl.selectRow(index);
                solo.app.drawing.selectItem(index);
            });
        },
        /**
         * Toggles the visibility state of the IPC item in the 3D window.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {number} index
         * @param {boolean} [visible]
         * @requires addons/catalog
         */
        toggleItemVisibility: toggleItemVisibility,
        /**
         * Restores the view of the current IPC sheet to its default view.
         * Restores all the IPC items to its initial state (transparency, visibility).
         * Clears all selection and DPL filters.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {boolean} [animated]
         * @requires addons/catalog
         */
        resetCurrentSheet: function (animated) {
            resetCurrentSheet(animated);
            resetAllObjects(animated);
        },
        /**
         * Restores all the IPC items to its initial state (transparency, visibility).
         * Clears all selection and DPL filters.
         * 
         * @memberof Cortona3DSolo.app.ipc
         * @method
         * @param {boolean} [animated]
         * @requires addons/catalog
         */
        resetAllObjects: resetAllObjects
    });

    /**
     * Extended methods and properties of the namespace `Cortona3DSolo.app.ipc.interactivity`.
     * 
     * @namespace app.ipc.interactivity
     * @memberof Cortona3DSolo
     * @mixin
     */
    // ipc.interactivity expando
    solo.expand(ipc.interactivity, {
        /**
         * Returns the 3D object handles for the DPL row.
         * 
         * @memberof Cortona3DSolo.app.ipc.interactivity
         * @method
         * @param {number} row  DPL line number
         * @param {boolean} [deep=true]
         * @returns {Handle[]}
         * @requires addons/catalog
         */
        getObjectsForRow: function (row, deep) {
            if (row < 0) return [];
            if (typeof deep === 'undefined') deep = true;
            var all = [row];
            if (deep) {
                all = all.concat(ixml.getChildren(row, true));
            }
            return all.reduce(function (acc, row) {
                return acc.concat(ixml.getObjectsNamesByRow(row));
            }, []).reduce(function (acc, name) {
                return acc.concat(solo.app.getObjectWithName(name) || []);
            }, []);
        },
        /**
         * Gets an array of CatalogSheetInfo objects for all IPC pages in which the IPC item is active.
         * 
         * @memberof Cortona3DSolo.app.ipc.interactivity
         * @method
         * @param {number} row  DPL line number
         * @returns {CatalogSheetInfo[]}
         * @requires addons/catalog
         */
        getSheetsForRow: function (row) {
            var sheets = solo.app.modelInfo.sheets;
            return sheets.filter(function (sheet) {
                return sheet.items.indexOf(row) >= 0;
            });
        },
        /**
         * Gets the DPL column index by its unique identifier.
         * 
         * @memberof Cortona3DSolo.app.ipc.interactivity
         * @method
         * @param {number} id  DPL column identifier
         * @returns {number}
         * @requires addons/catalog
         */
        getDPLColumnIndexById: function (id) {
            var root = ixml.json,
                entry = root.$('ipc/figure/ipc-table/table/thead/row/entry'),
                index = entry.length - 1;

            while (index >= 0 && entry[index].$attr('column-id') !== id) {
                index -= 1;
            }

            return index;
        },
        /**
         * Gets an XMLNodeData object corresponding to the DPL command with a unique identifier specified by the id argument.
         * 
         * @memberof Cortona3DSolo.app.ipc.interactivity
         * @method
         * @param {number} id  DPL command identifier
         * @returns {XMLNodeData}
         * @requires addons/catalog
         */
        getCommandById: function (id) {
            return commands[id];
        }
    });

    // ipc.interactivity overwriting
    solo.expand(ipc.interactivity, {
        getRowByIndex: function (index) {
            return (m_fullDPLMode || index < 0) ? index : getRowByIndex(index);
        },

        getIndexByRow: function (row) {
            return (m_fullDPLMode || row < 0) ? row : getIndexByRow(row);
        },

        getChildren: function (row, deep) {
            return !solo.app.recursiveObjectLookup ? getChildren.call(ixml, row, deep) : [];
        }
    });

    /**
     * Extended methods and properties of the namespace `Cortona3DSolo.app.drawing`.
     * 
     * @namespace app.drawing
     * @memberof Cortona3DSolo
     * @mixin
     */
    // solo.app.drawing expando
    solo.app.drawing =
        solo.expand(solo.app.drawing || {}, {
            /**
             * Highlights the hotspot in the 2D drawing.
             * 
             * @memberof Cortona3DSolo.app.drawing
             * @method
             * @param {number} index
             * @requires addons/catalog
             */
            hoverItem: function (index) {
                if (!solo.app.drawing.hoverHotspot) return;
                var name = ixml.getItemByIndex(index);
                solo.app.drawing.hoverHotspot(name);
            },
            /**
             * Selects the hotspot in the 2D drawing.
             * 
             * @memberof Cortona3DSolo.app.drawing
             * @method
             * @param {number} index
             * @requires addons/catalog
             */
            selectItem: function (index, flag) {
                var color;
                if (!solo.app.drawing.selectHotspot) return;
                if (flag === false) color = "";
                var name = ixml.getItemByIndex(index);
                solo.app.drawing.selectHotspot(name, color);
            }
        });

    // subscribe to
    // hover
    solo.on('app.ipc.dpl.didHoverRow', ipc.hoverItem);
    solo.on('app.ipc.didHoverItem', ipc.hoverItem);
    solo.on('app.drawing.didHoverHotspot', function (name, hover) {
        var index = hover ? this.app.ipc.interactivity.getIndexByItem(name) : -1;
        this.app.ipc.hoverItem(index);
        this.dispatch('app.drawing.didHoverItem', index);
    });
    // select
    var m_lastDPLRowSelected = -1;

    function selectHandler(index, key, target) {
        var isSelectOnlyClickedObject = target.selectOnlyClickedObject && m_clickedHandle;
        if (!key) {
            if (!isSelectOnlyClickedObject && selectedRows.indexOf(ixml.getRowByIndex(index)) >= 0) {
                // clear selection
                index = -1;
            }
            ipc.selectItem(index);
            solo.dispatch('catalog.didSelectItem', index, target);
        } else if (key === 2 && index >= 0) { // Ctrl
            ipc.toggleSelection(index);
        }
        if (index < 0) m_lastDPLRowSelected = -1;
        solo.dispatch('catalog.didChangeSelection', Array.prototype.slice.call(selectedRows));
    }

    solo.on('app.ipc.dpl.didSelectRow', function (index, key) {
        if (catalog.options.disableMultipleSelections) key = key & ~3;
        if (key === 1 && m_lastDPLRowSelected >= 0) { // Shift, range
            var lastDPLIndex = ixml.getIndexByRow(m_lastDPLRowSelected);
            ipc.selectItem(lastDPLIndex);
            var step = index - lastDPLIndex;
            if (step !== 0) {
                step = step > 0 ? 1 : -1;
                var i = lastDPLIndex;
                while (i != index) {
                    i += step;
                    ipc.toggleSelection(i);
                }
                solo.dispatch('catalog.didChangeSelection', Array.prototype.slice.call(selectedRows));
            }
        } else {
            m_lastDPLRowSelected = ixml.getRowByIndex(index);
            selectHandler(index, key, solo.app.ipc.dpl);
        }
    });
    solo.on('app.ipc.didSelectItem', function (index, indices, key) {
        if (catalog.options.disableMultipleSelections) key = key & ~3;
        selectHandler(index, key, solo.app.ipc);
    });
    solo.on('app.drawing.didSelectHotspot', function (name, key) {
        if (catalog.options.disableMultipleSelections) key = key & ~3;
        var index = this.app.ipc.interactivity.getIndexByItem(name);
        selectHandler(index, key, solo.app.drawing);
        this.dispatch('app.drawing.didSelectItem', index, key);
    });
    // context menu
    solo.on('app.didCallContextMenu', function (x, y, target) {
        var row = -1;
        var object = this.app.pickObject(x, y, !solo.app.recursiveObjectLookup),
            name = object ? getActualDPLObjectName(object.handle) : '';
        if (name) {
            row = this.app.ipc.interactivity.getRowByObjectName(name);
            row = this.app.ipc.interactivity.getRowByIndex(getActiveIndex(row));
            if (m_fullDPLMode && !catalog.options.enableGhostItems && isGhostRow(row)) {
                row = -1;
            }
        }
        this.dispatch('catalog.didCallContextMenu', row, x, y, target);
    });
    solo.on('app.drawing.didCallContextMenu', function (name, x, y, target) {
        var row = -1;
        if (name) {
            row = this.app.ipc.interactivity.getRowByItem(name);
        }
        this.dispatch('catalog.didCallContextMenu', row, x, y, target);
    });
    solo.on('app.ipc.dpl.didCallContextMenu', function (index, x, y, target) {
        var row = ixml.getRowByIndex(index);
        this.dispatch('catalog.didCallContextMenu', row, x, y, target);
    });

    function getActualDPLObjectName(handle) {
        var p = handle;
        if (solo.app.recursiveObjectLookup) {
            // keep3DStructure
            var row = ixml.getRowByObjectName(solo.app.getObjectName(p)),
                index = ixml.getIndexByRow(row);

            while (index < 0) {
                p = solo.app.getParentObject(p);
                if (!p) break;
                row = ixml.getRowByObjectName(solo.app.getObjectName(p));
                index = ixml.getIndexByRow(row);
            }
        }
        return p ? solo.app.getObjectName(p) : "";
    }

    solo.on('touch.didObjectEnter', function (handle) {
        var name = getActualDPLObjectName(handle),
            row = ixml.getRowByObjectName(name),
            index = getActiveIndex(row);

        if (m_fullDPLMode && !catalog.options.enableGhostItems && isGhostRow(ixml.getRowByIndex(index))) {
            index = -1;
        }

        //this.app.ipc.hoverItem(index);

        this.dispatch('app.ipc.didHoverItem', index, index < 0 ? [] : [index]);
    });

    solo.on('touch.didObjectOut', function (handle, name) {
        //this.app.ipc.hoverItem(-1);
        this.dispatch('app.ipc.didHoverItem', -1, []);
    });

    solo.on('touch.didObjectClick', function (h, n, x, y, button, key, event) {
        if (button !== 1) return; // Right or middle button
        if (key & ~2) return; // Alt or Shift

        var name = getActualDPLObjectName(h),
            handle = solo.app.getObjectWithName(name);

        m_clickedHandle = handle;

        if (typeof this.catalog.willObjectClick === 'function' && !this.catalog.willObjectClick(handle, name, x, y, button, key, event)) return;

        var row = ixml.getRowByObjectName(name),
            index = getActiveIndex(row);

        if (m_fullDPLMode && !catalog.options.enableGhostItems && isGhostRow(ixml.getRowByIndex(index))) {
            index = -1;
        }

        this.dispatch('app.ipc.didSelectItem', index, index < 0 ? [] : [index], key);
    });

    solo.on('app.ipc.didSelectSheet', function (sheet, fullDPLMode) {
        if (typeof fullDPLMode === 'undefined') {
            resetAllObjects(false);
            this.dispatch('app.ipc.didSelectItem', -1, []);
            this.dispatch('app.ipc.didHoverItem', -1, []);
        }
    });

    solo.on('app.ipc.didChangeItemVisibility', function (visible, indexes) {
        var prev = hiddenIndexes.map(function (index) {
            return ixml.getRowByIndex(index);
        });
        hiddenIndexes = visible ? difference(hiddenIndexes, indexes) : union(hiddenIndexes, indexes);
        this.dispatch('catalog.didChangeHiddenItems', hiddenIndexes.map(function (index) {
            return ixml.getRowByIndex(index);
        }), prev);
    });

    solo.on('catalog.didChangeFilteredItems', function (filtered, prev) {
        filteredRows = filtered;
        difference(prev, filtered)
            .map(function (row) {
                return ixml.getObjectsForRow(row);
            })
            .flat()
            .forEach(function (handle) {
                solo.app.setObjectVisibility(handle, true);
            });
        difference(filtered, prev)
            .map(function (row) {
                return ixml.getObjectsForRow(row);
            })
            .flat()
            .forEach(function (handle) {
                solo.app.setObjectVisibility(handle, false);
            });
    });

    
    

    solo.on('app.ipc.didSelectSheet', function (sheet, fullDPLMode) {
        var animationWatchdogTimer, 
            savPointerEvents = '';
        function watchStartTransitionAnimation(sheetId) {
            if (sheetId === sheet.id) {
                m_sheetTransition = true;
                savPointerEvents = solo.core.canvas.style.pointerEvents;
                solo.core.canvas.style.pointerEvents = 'none';
                clearTimeout(animationWatchdogTimer);
                solo.once('app.ipc.didStopSheetTransitionAnimation', function (sheetId) {
                    if (sheetId === sheet.id) {
                        m_sheetTransition = false;
                        solo.core.canvas.style.pointerEvents = savPointerEvents;
                        solo.dispatch('catalog.sheetChangeCompleted');
                    }
                });
            }
        }
        clearTimeout(animationWatchdogTimer);
        animationWatchdogTimer = setTimeout(function () {
            solo.removeListener('app.ipc.willStartSheetTransitionAnimation', watchStartTransitionAnimation);
            m_sheetTransition = false;
            solo.core.canvas.style.pointerEvents = savPointerEvents;
            solo.dispatch('catalog.sheetChangeCompleted');
        }, 100);
        solo.once('app.ipc.willStartSheetTransitionAnimation', watchStartTransitionAnimation);
    });

    // self register
    solo.catalog = catalog;

    module.exports = catalog;
});

/**
 * The event that occurs when the user hovers the mouse pointer over the DPL row.
 * @event Cortona3DSolo~"catalog.didHoverItem"
 * @type {arguments}
 * @prop {number} index IPC page line number
 */
/**
 * The event that occurs when the visibility of 3D objects associated with the DPL row changes.
 * @event Cortona3DSolo~"catalog.didChangeHiddenItems"
 * @type {arguments}
 * @prop {number[]} indexes Array of IPC page line numbers with hidden 3D objects
 */
/**
 * The event that occurs when the DPL row is selected.
 * @event Cortona3DSolo~"catalog.didSelectItem"
 * @type {arguments}
 * @prop {number} index IPC page line number
 * @prop {object} targetNamespace Namespace target:
 * - {@link Cortona3DSolo.app.ipc}
 * - {@link Cortona3DSolo.app.ipc.dpl}
 * - {@link Cortona3DSolo.app.drawing}
 */
/**
 * The event that occurs when the selected DPL rows are changed.
 * @event Cortona3DSolo~"catalog.didChangeSelection"
 * @type {arguments}
 * @prop {number[]} rows Array of selected DPL table line numbers
 */
/**
 * The event that occurs when the user calls the context menu.
 * @event Cortona3DSolo~"catalog.didCallContextMenu"
 * @type {arguments}
 * @prop {number} row DPL table line number
 * @prop {number} x
 * @prop {number} y
 * @prop {HTMLElement} target
 */
/**
 * The event that occurs when the IPC page changes is completed.
 * @event Cortona3DSolo~"catalog.sheetChangeCompleted"
 */