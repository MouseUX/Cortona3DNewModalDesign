/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableExpandButton {boolean}
 * @prop disableSheetButtons {boolean}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-toolbar-procedure-drawing.css');

    module.exports = function (skin, options, solo) {
        var svgAssets = skin.create(require('./solo-skin-svg-assets'));

        var i18n = solo.expand({}, solo.uniview.i18n['ui'], solo.uniview.i18n['solo-skin-toolbar-procedure-drawing']),
            title = skin.create('.fig-title'),

            closeButton = skin.buttonImg({
                classList: 'button-close',
                title: i18n.close,
                onclick: function () {
                    solo.dispatch('uniview.toggleMainSecondaryPanel', false);
                }
            }, skin.html(svgAssets.cross)),

            prevButton = options.disableSheetButtons ? '' : skin.buttonImg({
                id: 'sheet-button-prev',
                title: i18n.prevSheet,
                onclick: function () {
                    var sheet = (+title.dataset.sheet) - 1,
                        cond = '[data-figure="' + title.dataset.figure + '"][data-sheet="' + sheet + '"]';
                    var a = document.querySelector('.doc-container a.graphic.link' + cond + ', .doc-container a.multimediaObject.link' + cond);
                    if (a) {
                        a.click();
                    }
                }
            }, skin.html(svgAssets.tr_left)),

            nextButton = options.disableSheetButtons ? '' : skin.buttonImg({
                id: 'sheet-button-next',
                title: i18n.nextSheet,
                onclick: function () {
                    var sheet = (+title.dataset.sheet) + 1,
                        cond = '[data-figure="' + title.dataset.figure + '"][data-sheet="' + sheet + '"]';
                    var a = document.querySelector('.doc-container a.graphic.link' + cond + ', .doc-container a.multimediaObject.link' + cond);
                    if (a) {
                        a.click();
                    }
                }
            }, skin.html(svgAssets.tr_right)),

            sheetButtons = skin.container('.sheet-buttons',
                prevButton,
                nextButton,
            ),

            element = skin.toolbar('.main.top',
                skin.container('.left', title),
                skin.container('.right',
                    //sheetButtons,
                    closeButton
                )
            );

        function titleHandler(node, keepTitle) {
            if (keepTitle) return;
            skin.clear(title);
            title.classList.toggle('multimedia', node.dataset.link === 'linkMedia');
            if (node.dataset.figure) {
                title.dataset.figure = node.dataset.figure;
            } else {
                delete title.dataset.figure;
            }
            if (node.dataset.sheets > 1) {
                title.dataset.sheets = node.dataset.sheets;
                skin.show(sheetButtons);
                prevButton.classList.remove('disabled');
                nextButton.classList.remove('disabled');
                if (node.dataset.sheet == 1) {
                    prevButton.classList.add('disabled');
                }
                if (node.dataset.sheet == node.dataset.sheets) {
                    nextButton.classList.add('disabled');
                }
            } else {
                delete title.dataset.sheets;
                skin.hide(sheetButtons, true);
            }
            if (node.dataset.sheet) {
                title.dataset.sheet = node.dataset.sheet;
            } else {
                delete title.dataset.sheet;
            }
            title.append(node.dataset.title || node.title || node.dataset.infoentityident || node.dataset.boardno || '');
        }

        solo.on('uniview.secondaryFigure', titleHandler);

        return this.exports(element);
    };
});