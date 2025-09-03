define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var DELTA = 10,
            SPIN_DELTA = DELTA * Math.PI / 200;

        /*
            bool tiramisu_navigate(int action, float arg1, float arg2);

            NAVIGATOR_ACTION_SPIN   = 0,  arg1 = offsetX, arg2 = offsetY
            NAVIGATOR_ACTION_PAN    = 1,  arg1 = translationX, arg2 = translationY
            NAVIGATOR_ACTION_ZOOM   = 2,  arg1 = zoomScale
            NAVIGATOR_ACTION_ROTATE = 3,  arg1 = angle

        */

        if (!solo.app.navigate && solo.app.drawing && !solo.app.drawing.shiftBy) {
            return;
        }

        solo.on('touch.didObjectClick', function () {
            window.focus();
        });
        solo.on('app.willStartNavigateInScene', function () {
            window.focus();
        });

        window.addEventListener('keydown', function (e) {
            var isCanvasVisible = solo.core && solo.core.canvas && solo.app.ui.isCanvasVisible(),
                isDrawingVisible = solo.app.drawing && solo.app.drawing.isVisible();

            switch (e.keyCode) {
                case 37: // arrow left
                    if (isCanvasVisible) {
                        if (e.ctrlKey && solo.app.modelInfo.type === 'procedure') { // + ctrl
                            solo.app.procedure.setPlayPosition(solo.app.procedure.position - 0.2, true);
                        } else if (e.shiftKey) { // + shift
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_PAN, -DELTA, 0);
                        } else {
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_SPIN, SPIN_DELTA, 0);
                        }
                        e.preventDefault();
                    } else if (isDrawingVisible) {
                        solo.app.drawing.shiftBy(-DELTA, 0);
                        e.preventDefault();
                    }
                    break;
                case 38: // arrow up
                    if (isCanvasVisible) {
                        if (e.ctrlKey) { // + ctrl
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_ZOOM, 1.1);
                        } else if (e.shiftKey) { // + shift
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_PAN, 0, -DELTA);
                        } else { // + ctrl
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_SPIN, 0, SPIN_DELTA);
                        }
                        e.preventDefault();
                    } else if (isDrawingVisible) {
                        if (e.ctrlKey) { // + ctrl
                            solo.app.drawing.scaleBy(-0.1);
                        } else {
                            solo.app.drawing.shiftBy(0, -DELTA);
                        }
                        e.preventDefault();
                    }
                    break;
                case 39: // arrow right
                    if (isCanvasVisible) {
                        if (e.ctrlKey && solo.app.modelInfo.type === 'procedure') { // + ctrl
                            solo.app.procedure.setPlayPosition(solo.app.procedure.position + 0.2, true);
                        } else if (e.shiftKey) { // + shift
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_PAN, DELTA, 0);
                        } else {
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_SPIN, -SPIN_DELTA, 0);
                        }
                        e.preventDefault();
                    } else if (isDrawingVisible) {
                        solo.app.drawing.shiftBy(DELTA, 0);
                        e.preventDefault();
                    }
                    break;
                case 40: // arrow down
                    if (isCanvasVisible) {
                        if (e.ctrlKey) { // + ctrl
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_ZOOM, 0.9);
                        } else if (e.shiftKey) { // + shift
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_PAN, 0, DELTA);
                        } else {
                            solo.app.navigate(solo.app.NAVIGATOR_ACTION_SPIN, 0, -SPIN_DELTA);
                        }
                        e.preventDefault();
                    } else if (isDrawingVisible) {
                        if (e.ctrlKey) { // + ctrl
                            solo.app.drawing.scaleBy(0.1);
                        } else {
                            solo.app.drawing.shiftBy(0, DELTA);
                        }
                        e.preventDefault();
                    }
                    break;
                case 36: // home
                    if (isDrawingVisible) {
                        solo.app.drawing.reset();
                        e.preventDefault();
                    }
                    break;
            }
        });
    };
});