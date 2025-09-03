define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        solo.on('app.didChangeSelectedObjects', function () {
            var docId = solo.app.getSelectedObjects()
                .map(solo.app.getObjectName)
                .map(solo.app.procedure.interactivity.getDocIdByObjectName);
            solo.dispatch('uniview.secondaryFigure.setSelectedObjects', docId);
        });
        solo.on('procedure.didObjectEnter', function (docId) {
            solo.dispatch('uniview.secondaryFigure.setHoveredObjects', docId);
            solo.core.canvas.title = docId;
        });
        solo.on('procedure.didObjectOut', function (docId) {
            solo.dispatch('uniview.secondaryFigure.removeHoveredObjects', docId);
            solo.core.canvas.title = '';
        });
        solo.on('procedure.didObjectClick', function (docId) {
            solo.dispatch('uniview.secondaryFigure.setSelectedObjects', docId);
        });
        solo.on('app.drawing.didSelectHotspot', function (name) {
            var docId = solo.app.getSelectedObjects()
                .map(solo.app.getObjectName)
                .map(solo.app.procedure.interactivity.getDocIdByObjectName);
            solo.app.procedure.selectItem(docId, false);
            solo.app.procedure.selectItem(name, true);
        });
        solo.on('app.drawing.didLeaveHotspot', function (name) {
            solo.app.procedure.hoverItem(name, false);
        });
        solo.on('app.drawing.didEnterHotspot', function (name) {
            solo.app.procedure.hoverItem(name, true);
        });
    };
})
