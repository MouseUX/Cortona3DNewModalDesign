define(function(require, exports, module) {
    require('css!./print-graphics.css');

    var print = require('./print'),
        loadImage = require('lib/load-image');


    module.exports = {
        print: function(options) {
            var solo = Cortona3DSolo,
                sheetInfo = solo.app.ipc.currentSheetInfo,
                opt = solo.expand({
                    printHeader: {
                        sheetLabel: '',
                        sheetInfo: sheetInfo
                    }
                }, options),
                skin = solo.skin.get('app');

            var printImagePage = function (image, label) {
                image.classList.add('graphics');
                return print.printPage(opt, [
                    image,
                    skin.div('.graphics-label', label)
                ]);
            };

            var print3DImage = function(image) {
                solo.dispatch("core.didChangeLayout");
                printImagePage(image, solo.uniview.metadata.ICN || '');
            };

            if (solo.app.ui.isDrawingDisplayMode()) {
                loadImage(sheetInfo.drawing)
                    .then(function(image) {
                        printImagePage(image, sheetInfo.drawing.replace(/(^.*\/|\.[^.]+$)/g, ''));
                    });
            } else {
                var dpi = 300,
                    pxmm = dpi / 25.4 / (window.devicePixelRatio || 1), // px/mm 300 dpi
                    w = 170 * pxmm, // 170 mm
                    h = 210 * pxmm; // 210 mm

                if (solo.app.makeSceneSnapshot) {
                    solo.app.makeSceneSnapshot(w, h, 0, solo.app.SNAPSHOT_USE_SCENE_CAMERA, dpi)
                        .then(loadImage)
                        .then(print3DImage);
                } else {
                    requestAnimationFrame(function() {
                        loadImage(solo.core.canvas.toDataURL())
                            .then(print3DImage);
                    });
                    solo.app.resize(w, h);
                }
            }
        }
    };
});