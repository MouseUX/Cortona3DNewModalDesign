/**
 * 
 */
define(function (require, exports, module) {
    require('css!./catalog-ata2200.css');

    function _00(n) {
        n = n || 0;
        return (n < 10) ? '0' + n : n;
    }

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            meta = solo.uniview.metadata,
            snsName = _00(meta._302B778AB60844a4AC6BDCD31C5566F2) + '-' + _00(meta._6075008EF910457aB9C7AD0032853538) + '-' + _00(meta._1482D808FEA94afeB6666F2CB8433A1A),
            i18n = solo.uniview.i18n['catalog-ata2200'] || {};

        var m_attach,
            m_attachGroup,
            m_sheetItemsCount,
            re = /(\d{2}-\d{2}-\d{2}-\d{2}[A-Za-z]?)-?(\d{3}[A-Za-z]?)?/;

        var NOMENCLATURE = '1DBC71E79D72426792D9C3E99D6377EF';

        document.title = (meta._87F24245DF264B26989A16C3B4471D31 || snsName) + ' - ' + solo.uniview.description;

        solo.on('app.ipc.didSelectSheet', function (sheet) {
            m_sheetItemsCount = ixml.getSheetInfo(sheet.id).items.length;
            m_attach = false;
            m_attachGroup = 0;
        });

        solo.on('app.ipc.dpl.willSetupTable', function (dplTableElement) {
            if (!dplTableElement.querySelector('.fig')) {
                Array.prototype.slice.call(dplTableElement.querySelectorAll('thead td'))[1].append(
                    skin.div('.fig', skin.create('pre', {}, options.figure || ''))
                );
            }
        });

        solo.on('catalog.afterFilterApplyOnDPL', function () {
            var tbody = document.querySelector('#dpl-table tbody'),
                attachGroup = 0,
                isEmpty;

            if (tbody) {
                for (attachGroup = 0; tbody.querySelector('tr[data-attach-group="' + attachGroup + '"]'); attachGroup++) {
                    isEmpty = tbody.querySelectorAll('tr[id][data-attach-group="' + attachGroup + '"]').length === tbody.querySelectorAll('tr.hidden[id][data-attach-group="' + attachGroup + '"]').length;
                    Array.prototype.slice.call(tbody.querySelectorAll('tr.aux[data-attach-group="' + attachGroup + '"]')).forEach(function (n) {
                        skin.toggle(n, !isEmpty);
                    });
                }
                // dpl inline fig 
                isEmpty = tbody.querySelectorAll('tr[id]').length === tbody.querySelectorAll('tr.hidden[id]').length;
                skin.toggle(document.querySelector('#dpl-table thead .fig'), !isEmpty);
            }
        });

        solo.on('uniview.dpl.didSetupReferenceCommand', function (el, span) {
            var text = span.textContent.replace(/\s*[\r\n]+\s*/g, ''),
                a = re.exec(text);
            if (a) {
                var csn = a[1],
                    item = a[2] || '';

                el.dataset.csn = csn;
                el.dataset.item = item;

                el.href = solo.app.util.toUrl(csn + '.htm' + (item && '#' + item));
            }
        });

        solo.on('app.ipc.dpl.didSetupRow', function (rowElement, index) {
            function createAuxRow(text) {
                var newRow = document.createElement('tr'),
                    syntax = Array.prototype.slice.call(rowElement.cells).reduce(function (syntax) {
                        return syntax + '<td></td>';
                    }, ''),
                    nomenclatureIndex = ixml.getDPLColumnIndexById(NOMENCLATURE);

                newRow.className = 'aux';
                newRow.dataset.attachGroup = m_attachGroup;
                newRow.innerHTML = syntax;

                if (nomenclatureIndex > 0) {
                    newRow.cells[nomenclatureIndex].innerHTML = '<pre>' + text + '</pre>';
                }

                return newRow;
            }

            var info = ixml.getItemInfo(ixml.getRowByIndex(index));

            // is attached?
            if (+info.metadata._301F121F8EF84EC0B9979C8D10D19A79) {
                if (!m_attach) {
                    m_attach = true;
                    rowElement.parentNode.insertBefore(createAuxRow(i18n.attachingPartsStart), rowElement);
                } else if (index === m_sheetItemsCount - 1) {
                    rowElement.parentNode.appendChild(createAuxRow(i18n.attachingPartsEnd));
                }
            } else {
                if (m_attach) {
                    rowElement.parentNode.insertBefore(createAuxRow(i18n.attachingPartsEnd), rowElement);
                    m_attach = false;
                    m_attachGroup++;
                }
            }

            if (m_attach) {
                rowElement.dataset.attachGroup = m_attachGroup;
            }
        });

        return skin.use(require('uniview-ipc'), solo.expand({
            components: {
                uiDplHeader: require('../ata2200/solo-skin-ipc-dpl-header')
            },
            logoSrc: '',
            dplReferenceCommands: ["NHA_REF", "DET_REF", "CSN_REF"],
            dplColumnIdNomenclature: NOMENCLATURE
        }, options));
    };
});