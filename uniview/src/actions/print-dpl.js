define(function (require, exports, module) {
    require('css!./print-dpl.css');

    module.exports = {
        print: function (options) {
            var solo = Cortona3DSolo,
                opt = solo.expand({
                    printHeader: {
                        sheetLabel: '',
                        sheetInfo: solo.app.ipc.currentSheetInfo,
                        dismissSheetTitle: solo.app.ipc.fullDPLMode
                    }
                }, options),
                m_dplTable = document.querySelector('.dpl-table'),
                m_legend = document.querySelector('.dpl-legend'),
                m_legendHolder,
                m_holder = m_dplTable.parentNode,
                m_dpl = [m_dplTable];

            if (m_legend) {
                m_dpl.push(m_legend);
                m_legendHolder = m_legend.parentNode;
            }

            require('./print')
                .printPage(opt, m_dpl)
                .then(function () {
                    m_holder.append(m_dplTable);
                    if (m_legend) {
                        m_legendHolder.append(m_legend);
                    }
                });
        }
    };
});