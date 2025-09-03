define(function (require, exports, module) {
    var solo = Cortona3DSolo,
        SCALEDELTA = 0.1,
        i18n = solo.uniview.i18n['context-menu-items-drawing'] || {};

    module.exports = [{
            description: i18n.zoomIn,
            action: function () {
                solo.app.drawing.scaleBy(-SCALEDELTA);
            }
        },
        {
            description: i18n.zoomOut,
            action: function () {
                solo.app.drawing.scaleBy(SCALEDELTA);
            }
        },
        null,
        {
            description: i18n.bestFit,
            action: function () {
                solo.app.drawing.reset();
            }
        }
    ];
});