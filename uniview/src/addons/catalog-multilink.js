define(function (require, exports, module) {
    // add multiLink support

    /**
     * @props {object} options
     * @props {function} [options.testMultiLinkCondition=function (info, infoSrc) { return true; }]
     * @props {boolean} options.disableDefaultMultiLinkCondition
     */

    module.exports = function (options) {
        var SetOp = require('./catalog/set-op');

        var solo = Cortona3DSolo,
            ixml = solo.app.ipc.interactivity,
            m_hoveredIndex = -1,
            m_selectedRows = [];

        options = options || {};

        /**
         * @param {number} indexSrc 
         * @returns {number[]} Array of indexes
         */
        function findDuplicates(indexSrc) {
            var dup = [];
            if (indexSrc >= 0) {
                var infoSrc = ixml.getItemInfo(ixml.getRowByIndex(indexSrc)),
                    items = ixml.getSheetInfo(solo.app.ipc.currentSheetInfo.id).items,
                    condition = (typeof options.testMultiLinkCondition === 'function') ? options.testMultiLinkCondition : function () {
                        return true;
                    },
                    defaultCondition = options.disableDefaultMultiLinkCondition ? function () {
                        return true;
                    } : function (info, infoSrc) {
                        return SetOp.intersection(info.objectNames, infoSrc.objectNames).length;
                    };

                dup = items.filter(function (row, index) {
                    var info = ixml.getItemInfo(row);
                    return index !== indexSrc && defaultCondition(info, infoSrc) && condition(info, infoSrc);
                });
            }
            return dup.map(function (row) {
                return ixml.getIndexByRow(row);
            });
        }

        solo.on('catalog.didHoverItem', function (index) {
            if (m_hoveredIndex >= 0 && m_hoveredIndex !== index) {
                findDuplicates(m_hoveredIndex).forEach(function (index) {
                    solo.app.ipc.dpl.highlightRow(index, false);
                });
            }
            m_hoveredIndex = index;
            findDuplicates(index).forEach(function (index) {
                solo.app.ipc.dpl.highlightRow(index, true);
            });
        });

        solo.on('catalog.didChangeSelection', function (selectedRows) {
            var oldSelection = m_selectedRows.map(ixml.getIndexByRow),
                newSelection = selectedRows.map(ixml.getIndexByRow);

            // selected items
            SetOp.difference(newSelection, oldSelection).forEach(function (index) {
                var dup = findDuplicates(index);
                SetOp.difference(dup, newSelection).forEach(function (index) {
                    solo.app.ipc.addSelection(index);
                });
            });

            // unselected items 
            SetOp.difference(oldSelection, newSelection).forEach(function (index) {
                var dup = findDuplicates(index);
                SetOp.intersection(dup, oldSelection).forEach(function (index) {
                    solo.app.ipc.removeSelection(index);
                });
            });

            m_selectedRows = solo.app.ipc.selectedItems;
        });

        function didChangeItemVisibility(visible, changed) {
            var items = changed.map(ixml.getIndexByRow),
                indexes = items.reduce(function (acc, index) {
                    var dup = findDuplicates(index);
                    return SetOp.union(acc, dup);
                }, items);
            solo.removeListener('app.ipc.didChangeItemVisibility', didChangeItemVisibility);
            solo.dispatch('app.ipc.didChangeItemVisibility', visible, indexes);
            solo.on('app.ipc.didChangeItemVisibility', didChangeItemVisibility);
        }

        solo.on('app.ipc.didChangeItemVisibility', didChangeItemVisibility);
    };
});