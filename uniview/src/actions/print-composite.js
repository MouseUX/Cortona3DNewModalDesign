define(function (require, exports, module) {
    require('css!./print-dpl.css');
    require('css!./print-graphics.css');

    var print = require('./print'),
        loadImage = require('lib/load-image');

    module.exports = {
        print: function (options) {
            var solo = Cortona3DSolo,
                opt = solo.expand({
                    printHeader: {
                        sheetLabel: ''
                    }
                }, options),
                skin = solo.skin.get('app'),
                m_dplTable = document.querySelector('.dpl-table'),
                m_legend = document.querySelector('.dpl-legend'),
                m_holderDplTable = m_dplTable.parentNode,
                m_legendHolder,
                m_dpl = [m_dplTable],
                sheetsFilter = typeof options.sheetsFilter === 'function' ? options.sheetsFilter : function () { return true; },
                sheets = solo.app.ipc.fullDPLMode ? solo.app.modelInfo.sheets.filter(sheetsFilter) : [solo.app.ipc.currentSheetInfo];

            if (m_legend) {
                m_dpl.push(m_legend);
                m_legendHolder = m_legend.parentNode;
            }

            Promise.all(sheets.map(function (sheetInfo) {
                return loadImage(sheetInfo.drawing)
                    .then(function (image) {
                        return {
                            image: image,
                            sheetInfo: sheetInfo,
                            label: sheetInfo.drawing.replace(/(^.*\/|\.[^.]+$)/, '')
                        };
                    })
                    .catch(function () {
                        return Promise.resolve();
                    });
            }))
                .then(function (images) {
                    images.forEach(function (desc) {
                        if (desc) {
                            desc.image.classList.add('graphics');
                            print.appendPage(solo.expand({
                                printHeader: {
                                    sheetInfo: desc.sheetInfo
                                }
                            }, opt), [
                                desc.image,
                                skin.div('.graphics-label', desc.label)
                            ]);
                        }
                    });
                })
                .then(function () {
                    print.appendPage(solo.expand({
                        printHeader: {
                            sheetInfo: sheets[0],
                            dismissSheetTitle: solo.app.ipc.fullDPLMode
                        },
                    }, opt), m_dpl);
                    print.print()
                        .then(function () {
                            m_holderDplTable.append(m_dplTable);
                            if (m_legend) {
                                m_legendHolder.append(m_legend);
                            }
                        });
                });
        }
    };
});