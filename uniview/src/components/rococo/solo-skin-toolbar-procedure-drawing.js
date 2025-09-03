/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableExpandButton {boolean}
 * @prop disableSheetButtons {boolean}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-toolbar-procedure-drawing.css');

    var uiButtonExpand = require('./ui/btn-expand');

    function findPrevSheet(title) {
        var sheet = +title.dataset.sheet,
            a = null,
            cond;
        while (!a && sheet > 0) {
            sheet = sheet - 1;
            cond = '[data-figure="' + title.dataset.figure + '"][data-sheet="' + sheet + '"]';
            a = document.querySelector('.doc-container a.graphic.link' + cond + ', .doc-container a.multimediaObject.link' + cond);
            if (a && (!a.classList.contains('link') || a.classList.contains('filterHide'))) a = null;
        }
        return a;
    }

    function findNextSheet(title) {
        var sheet = +title.dataset.sheet,
            sheets = +title.dataset.sheets,
            a = null,
            cond;
        while (!a && sheet <= sheets) {
            sheet = sheet + 1;
            cond = '[data-figure="' + title.dataset.figure + '"][data-sheet="' + sheet + '"]';
            a = document.querySelector('.doc-container a.graphic.link' + cond + ', .doc-container a.multimediaObject.link' + cond);
            if (a && (!a.classList.contains('link') || a.classList.contains('filterHide'))) a = null;
        }
        return a;
    }

    module.exports = function (skin, options, solo) {
        var svgAssets = skin.create(require('./solo-skin-svg-assets'));

        var m_lastLinkNode;

        var i18n = solo.uniview.i18n['solo-skin-toolbar-procedure-drawing'] || {},

            buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
                panelName: 'Main'
            }).$el,

            title = skin.create('.fig-title'),

            prevButton = options.disableSheetButtons ? '' : skin.buttonImg({
                id: 'sheet-button-prev',
                title: i18n.prevSheet,
                classList: 'disabled',
                onclick: function () {
                    var a = findPrevSheet(title);
                    if (a) {
                        a.click();
                    }
                }
            }, skin.html(svgAssets.tr_left)),

            nextButton = options.disableSheetButtons ? '' : skin.buttonImg({
                id: 'sheet-button-next',
                title: i18n.nextSheet,
                classList: 'disabled',
                onclick: function () {
                    var a = findNextSheet(title);
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
                    sheetButtons,
                    options.drawingMode ? '' : skin.buttonImg({
                        id: 'btn-3d-display-mode',
                        title: i18n.toggleDisplayMode,
                        onclick: solo.app.procedure.toggleDrawingDisplayMode.bind(solo, false)
                    }),
                    buttonExpand
                )
            );

        if (!options.drawingMode) {
            skin.hide(element, true);
        }

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            skin.toggle(element, drawingMode);
        });

        function titleHandler(node, keepTitle) {
            if (!node || keepTitle) return;
            skin.clear(title);
            title.classList.toggle('multimedia', node.dataset.link === 'linkMedia');
            if (node.dataset.figure) {
                title.dataset.figure = node.dataset.figure;
            } else {
                delete title.dataset.figure;
            }
            if (node.dataset.sheet) {
                title.dataset.sheet = node.dataset.sheet;
            } else {
                delete title.dataset.sheet;
            }
            if (node.dataset.sheets > 1) {
                title.dataset.sheets = node.dataset.sheets;
                skin.show(sheetButtons);
                prevButton.classList.toggle('disabled', !findPrevSheet(title));
                nextButton.classList.toggle('disabled', !findNextSheet(title));
            } else {
                delete title.dataset.sheets;
                skin.hide(sheetButtons, true);
            }
            title.append(node.dataset.title || node.title || node.dataset.infoentityident || node.dataset.boardno || '');
            m_lastLinkNode = node;
        }

        solo.on('uniview.link2d', titleHandler);
        solo.on('uniview.linkMedia', titleHandler);

        solo.on('uniview.doc.filterChanged)', titleHandler.bind(null, m_lastLinkNode, true));

        return this.exports(element);
    };
});