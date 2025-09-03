/**
 * .clear()
 * .select(index)
 */
define(function (require, exports, module) {
    var solo = Cortona3DSolo,
        ixml = solo.uniview.ixml,
        doc = solo.uniview.doc,
        ipc = solo.app.ipc,
        normalSheetId = doc.sheets[0].id,
        explodedSheetId = (doc.sheets[1] || {}).id || normalSheetId,
        timeoutExplode,
        timeoutNormal;

    var transitionTimeout = +solo.uniview.options.ExplosionTimeout;
    if (typeof transitionTimeout !== 'number') transitionTimeout = 1000;
        
    function select(index) {
        if (solo.uniview.with3D) {
            clearTimeout(timeoutNormal);
            timeoutNormal = null;
            if (ipc.currentSheetInfo.id !== explodedSheetId) {
                if (!timeoutExplode) {
                    timeoutExplode = setTimeout(function () {
                        ipc.setCurrentSheet(explodedSheetId, true);
                        timeoutExplode = null;
                    }, transitionTimeout);
                }
            }
        }
    }

    function clear() {
        if (solo.uniview.with3D) {
            clearTimeout(timeoutExplode);
            timeoutExplode = null;
            if (ipc.currentSheetInfo.id !== normalSheetId) {
                if (!timeoutNormal) {
                    timeoutNormal = setTimeout(function () {
                        ipc.setCurrentSheet(normalSheetId, true);
                        timeoutNormal = null;
                    }, transitionTimeout);
                }
            }
        }
    }

    module.exports = {
        select: select,
        clear: clear
    };
});