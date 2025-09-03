/**
 * @param {object} options
 * @param {string[]} [options.dplColumnsForAnchor=['DESCR', 'PARTNUMBER']]
 */
define(function (require, exports, module) {
    require('css!./generic_ipc.css');

    var escapeHTML = require('lib/escape-html');

    module.exports = function (skin, options, solo) {
        require('addons/catalog');

        var ixml = solo.uniview.ixml,
            i18n = solo.expand(solo.uniview.i18n['ui'], solo.uniview.i18n['generic-ipc'] || {});

        function stopPropagation(event) {
            event.stopPropagation();
            if (!options.disableHashChangeHandler) {
                if (this.href === location.href && location.hash) {
                    solo.dispatch('uniview.hashChange', location.hash.substring(1));
                }
            }
        };

        function getTitle(url) {
            var referTo = (solo.uniview.i18n['solo-skin-ipc-toolbar'] || {}).referTo || 'Refer to';
            var a = /^#(view\()?([^\)]+)/.exec(url);
            if (a) {
                var row = ixml.getRowByItem(a[2]),
                    itemInfo = ixml.getItemInfo(row),
                    sheetInfo = ixml.getSheetInfo(a[2]),
                    isLinkToPage = a[1] === 'view(' || sheetInfo;
                if (itemInfo || sheetInfo) {
                    if (isLinkToPage) {
                        sheetInfo = sheetInfo || ixml.getSheetInfo(itemInfo.sheetId || (ixml.getSheetsForRow(row)[0] || {}).id);
                        if (sheetInfo) {
                            return referTo + " " + sheetInfo.description;
                        }
                    } else {
                        return referTo + " " + itemInfo.roles[3] + (itemInfo.roles[4] || '');
                    }
                }
            }
            return url;
        }

        solo.on('app.ipc.dpl.didSetupRow', function (rowElement, index) {
            var href = ixml.getItemInfo(ixml.getRowByIndex(index)).metadata._B479653540A9423B8170B31E38783811; // URL
            if (href) {
                (options.dplColumnsForAnchor || ['DESCR', 'PARTNUMBER']).forEach(function (colId) {
                    var index = ixml.getDPLColumnIndexById(colId);

                    if (index < 0) return;

                    var pre = rowElement.cells[index].children[0], // td[4] pre
                        commands = Array.prototype.slice.call(pre.querySelectorAll('.command'));

                    if (!commands.length) {
                        commands = [pre];
                    }

                    commands.forEach(function (span) {
                        span.innerHTML = '<a>' + escapeHTML(span.textContent) + '</a>';
                        Array.prototype.slice.call(span.querySelectorAll('a')).forEach(function (a) {
                            var title = getTitle(href);
                            a.href = href;
                            a.title = title;
                            if (href.indexOf('#') !== 0) {
                                a.target = solo.uniview.options.UrlTarget;
                            }
                            a.onclick = stopPropagation;
                        });
                    });
                });
            }
        });

        solo.on('uniview.dpl.didSetupReferenceCommand', function (a, span) {
            var command = ixml.getCommandById(span.dataset.ref);
            if (command) {
                var value1 = command.$('value')[1];
                if (value1) {
                    var url = value1.$text();
                    if (url) {
                        var title = getTitle(url);
                        a.href = url;
                        a.title = title;
                        if (url.indexOf('#') !== 0) {
                            a.target = solo.uniview.options.UrlTarget;
                        }
                        a.onclick = stopPropagation;
                    }
                }
            }
        });

        return skin
            .use(require('uniview-ipc'), solo.expand({
                dplReferenceCommands: ['Link'],
                dplColumnIdNomenclature: 'INFO',
                filter: [{
                    name: 'applicability',
                    label: i18n.filterApplicability,
                    values: [{
                        description: i18n.all,
                        value: '*'
                    }].concat(solo.catalog.filter.valuesMeta('APPLICABILITY').map(escapeHTML)),
                    test: solo.catalog.filter.testMeta.bind(solo, 'APPLICABILITY')
                }]
            }, options))
            .then(function () {
                if (Cortona3DSolo.catalog.filter.options) {
                    Cortona3DSolo.catalog.filter.options.allowDescendantFiltering = true;
                }
                if (solo.uniview.options.UseShoppingCart) {
                    var excelButton = skin.element.querySelector('#btn-excel'),
                        order = skin.create(require('components/rococo/solo-skin-ipc-order'), options);

                    // replace "excel" button with "basket" button 
                    excelButton.parentNode.replaceChild(order.$el, excelButton);

                    solo.dispatch('app.ipc.didSelectSheet', solo.app.ipc.currentSheetInfo);

                    var exportCSV = require('actions/catalog-export-to-csv');

                    solo.on('uniview.order', (typeof options.defaultOrderAction === 'function') ? options.defaultOrderAction.bind(exportCSV) : function (list) {

                        exportCSV.setCSVOptions({
                            linefeed: "\r\n"
                        });

                        var fn = 'order_' + exportCSV.getTimestampString() + '.csv',
                            thead = ixml.json.$('ipc/figure/ipc-table/table/thead/row/entry').slice(2),
                            head = exportCSV.joinCSVLine(thead.map(function (entry) {
                                return exportCSV.quoteCSVString(entry.$text('para'));
                            })),
                            csv = list.reduce(function (csv, item) {
                                var meta = item.info.part.metadata;
                                return csv + exportCSV.concatCSVLine(meta.DFP, meta.PNR, item.qty, item.comments);
                            }, head);

                        exportCSV.saveOrOpenCSV(fn, csv);
                    });
                }
            });
    };
});