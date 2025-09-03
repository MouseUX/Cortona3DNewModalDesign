/**
 * :catalogHashChangeHandler = {function(sheetId, itemnbr, func)}
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var ixml = solo.app.ipc.interactivity;

        function parseHash(hash) {
            var itemnbr = hash,
                func = '',
                a = /^(?:([^(]+)\()?([^()]*)\)?$/.exec(hash);

            if (a) {
                func = (a[1] || '').toLowerCase();
                itemnbr = a[2];
            }

            var row = ixml.getRowByItem(itemnbr),
                index = ixml.getIndexByItem(itemnbr),
                sheetId = row >= 0 ? ixml.getItemInfo(row).sheetId || (index < 0 ? ixml.getSheetsForRow(row)[0].id : solo.app.ipc.currentSheetInfo.id) : itemnbr,
                sheetInfo = ixml.getSheetInfo(sheetId);

            if (sheetInfo && row < 0) func = 'view';

            return {
                func: func,
                sheetId: sheetInfo ? sheetId : '',
                itemNumber: row >= 0 ? itemnbr : ''
            };
        }

        function defaultHashHandler(sheetId, itemnbr, func) {
            var selectItem = function () {
                var index = ixml.getIndexByItem(itemnbr);
                solo.dispatch('app.ipc.didSelectItem', -1, []);
                if (index >= 0) {
                    solo.dispatch('app.ipc.didSelectItem', index, [index]);
                }
            };

            if (sheetId) {
                var changed = solo.app.ipc.currentSheetInfo.id !== sheetId;
                solo.app.ipc.selectSheet(sheetId)
                    .then(sheetInfo => {
                        if (func) return;
                        if (changed) {
                            solo.once('catalog.sheetChangeCompleted', selectItem);
                        } else {
                            selectItem();
                        }
                    })
            }
        }

        /*
        if (!options.disableHashChangeHandler) {
            solo.once('uniview.ready', () => solo.on('app.ipc.didSelectSheet', sheetInfo => {
                var parsed = parseHash(location.hash.substring(1));
                if (parsed.sheetId && sheetInfo.id !== parsed.sheetId) {
                    location.assign('#' + sheetInfo.id);
                }
            }));
        }
        */

        solo.on('uniview.hashChange', function (hash) {
            var parsed = parseHash(hash),
                handler = (typeof options.catalogHashChangeHandler === 'function') ? options.catalogHashChangeHandler : defaultHashHandler;
            handler(parsed.sheetId, parsed.itemNumber, parsed.func);
        });
    };
});