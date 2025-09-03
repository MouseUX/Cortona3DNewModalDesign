/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop fitObjectFactor {number}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-transition-fraction.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = i18n = solo.uniview.i18n['solo-skin-ipc-toolbar'] || {};


        var rangeFraction = skin.input({
            type: 'range',
            title: i18n.titleTransitionFraction,
            min: 0,
            max: 100,
            step: 0.1,
            value: 100,
            onchange: function () {
                var value = this.value / (this.max - this.min);
                if (solo.app.ipc.transitionAnimationFraction !== value) {
                    solo.app.ipc.transitionAnimationFraction = value;
                }
                solo.app.setRotationCenterToSelectedObjects(true);
                solo.dispatch('catalog.didChangeTransitionAnimationFraction', value);
            }
        });

        rangeFraction.oninput = rangeFraction.onchange;

        var TIMEOUT = 1000,
            timeout,
            element = skin.create('.skin-transition-fraction', {
            onmouseover: function () {
                clearTimeout(timeout);
            },
            onmouseout: function () {
                hideRangeFraction();
            }
        }, rangeFraction);

        function hideRangeFraction() {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                skin.hide(element);
            }, TIMEOUT);
        }

        function showRangeFraction() {
            if (!solo.app.ipc.hasTransitionAnimation) return;
            if (!solo.uniview.settings.TransitionAnimationControl) return;
            var selectedObjects = solo.app.getSelectedObjects();
            if (selectedObjects.length) {
                solo.app.setRotationCenterToObjects(selectedObjects, true, false);
            }
            clearTimeout(timeout);
            skin.show(element);
        }

        function resetRangeFraction() {
            rangeFraction.value = rangeFraction.max;
            rangeFraction.onchange.call(rangeFraction);
        }

        solo.on('catalog.sheetChangeCompleted', resetRangeFraction);

        skin.hide(element);

        solo.on('touch.didPointerOut', function () {
            hideRangeFraction();
        });

        solo.on('app.ipc.didDrawingDisplayMode', function (is2DMode) {
            if (is2DMode) {
                clearTimeout(timeout);
                skin.hide(element);
            }
        });

        solo.on('uniview.settings.changedTransitionAnimationControl', function (enabled) {
            if (!enabled) {
                clearTimeout(timeout);
                skin.hide(element);
                resetRangeFraction();
            }
        });

        solo.on('touch.didObjectClick', function (h, n, x, y, k, a, event) {
            if (event.pointerType === 'touch') {
                TIMEOUT = 5000;
                showRangeFraction();
            }
        });

        solo.on('touch.didPointerMove', function (x, y) {
            var canvasRect = solo.core.canvas.getBoundingClientRect(),
                rangeRect = element.getBoundingClientRect(),
                y_startRange = canvasRect.height - rangeRect.height * 1.5;
            if (y > y_startRange) {
                TIMEOUT = 1000;
                showRangeFraction();
            } else {
                hideRangeFraction();
            }
        });

        return this.exports(element);
    };
});