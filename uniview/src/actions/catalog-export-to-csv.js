define(function (require, exports, module) {
    var solo = Cortona3DSolo,
        ixml = solo.uniview.ixml,
        i18n = solo.uniview.i18n['catalog-export-to-csv'] || {},
        DELIM = ',',
        CR = '\n';

    function setCSVOptions(options) {
        options = options || {};
        DELIM = options.delimiter || ',';
        CR = options.linefeed || '\n';
    }

    function saveOrOpenCSV(filename, csv) {
        var blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], {
            type: "text/csv;charset=utf-8"
        });

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            var link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function getTimestampString() {
        var now = new Date();
        return '' + now.getFullYear() + _00(now.getMonth() + 1) + _00(now.getDate()) + '-' + _00(now.getHours()) + _00(now.getMinutes()) + _00(now.getSeconds());
    }

    function _00(n) {
        n = n || 0;
        return n < 10 ? '0' + n : n;
    }

    function quoteCSVString(s) {
        s = s || '';
        var res = s;
        if (/^[\s\n]*$/.test(s)) {
            res = '';
        } else /*if (new RegExp('[\n' + DELIM + '"]').test(s))*/ {
            res = '"' + s.replace(/"/g, '""') + '"';
        }
        return res;
    }

    function concatCSVLine() {
        return Array.prototype.map.call(arguments, function (s) {
            return quoteCSVString(s);
        }).join(DELIM) + CR;
    }

    function joinCSVLine(a) {
        return a.join(DELIM) + CR;
    }

    function _entry(entry) {
        return quoteCSVString(entry.$text('cmdtext') + entry.$text('para'));
    }

    function exportToCSV(options) {
        options = options || {};
        setCSVOptions(options);

        var csv = '',
            meta = ixml.getProjectMetadata(),
            root = ixml.json,
            fn = 'order_' + getTimestampString() + '.csv',
            rows = solo.app.ipc.selectedItems,
            title = rows.length ? i18n.titleForSelection : i18n.title;

        if (!rows.length) { // no selected rows
            if (solo.app.ipc.fullDPLMode) {
                rows = root.$('ipc/figure/dplist/item').map(function (item, index) {
                    return index;
                });
            } else {
                rows = ixml.getSheetInfo(solo.app.ipc.getCurrentSheet().id).items;
            }
        }

        if (options.csvHeader) {
            csv += options.csvHeader;
        } else {
            csv += concatCSVLine("", title);
            csv += concatCSVLine("", options.title || meta.TITLE);
        }

        csv += concatCSVLine();
        csv += joinCSVLine(root.$('ipc/figure/ipc-table/table/thead/row/entry').reduce(function (a, entry, index) {
            return index ? a.concat(_entry(entry)) : a;
        }, []));
        csv += root.$('ipc/figure/ipc-table/table/tbody/row').filter(function (row, index) {
            return rows.indexOf(index) >= 0;
        }).map(function (row) {
            return joinCSVLine(row.$('entry').reduce(function (a, entry, index) {
                return index ? a.concat(_entry(entry)) : a;
            }, []));
        }).join('');

        csv = csv.replace(/•/g, '. ');

        //alert(csv);

        saveOrOpenCSV(options.filename || fn, csv);
    }

    module.exports = {
        getTimestampString: getTimestampString,
        setCSVOptions: setCSVOptions,
        quoteCSVString: quoteCSVString,
        concatCSVLine: concatCSVLine,
        joinCSVLine: joinCSVLine,
        saveOrOpenCSV: saveOrOpenCSV,
        exportToCSV: exportToCSV
    };
});