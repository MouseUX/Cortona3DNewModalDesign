define(function (require, exports, module) {

    /*
    <table id="dpl-table" class="dpl-table">
        <colgroup>
            <col width="0%">
            <col width="5%">
            <col width="43%">
            <col width="28%">
            <col width="4%">
            <col width="17%">
        </colgroup>
        <thead>
            <tr>
                <td width="0%">
                    <pre></pre>
                </td>
                <td width="5%">
                    <pre>ITEM</pre>
                </td>
                <td width="43%">
                    <pre>DESCRIPTION</pre>
                </td>
                <td width="28%">
                    <pre>PART NO.</pre>
                </td>
                <td width="4%">
                    <pre>QTY</pre>
                </td>
                <td width="17%">
                    <pre>INFO</pre>
                </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td width="0%" class="strut">
                    <div style="white-space:nowrap;">
                        <pre><span class="genericon genericon-show"></span>W</pre>
                    </div>
                </td>
                <td width="5%" class="strut">
                    <div style="white-space:nowrap;">
                        <pre>WWWW</pre>
                    </div>
                </td>
                <td width="43%" class="strut">
                    <div style="white-space:nowrap;">
                        <pre>WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW</pre>
                    </div>
                </td>
                <td width="28%" class="strut">
                    <div style="white-space:nowrap;">
                        <pre>WWWWWWWWWWWWWWWWWWWW</pre>
                    </div>
                </td>
                <td width="4%" class="strut">
                    <div style="white-space:nowrap;">
                        <pre>WWW</pre>
                    </div>
                </td>
                <td width="17%" class="strut">
                    <div style="white-space:nowrap;">
                        <pre>WWWWWWWWWWWW</pre>
                    </div>
                </td>
            </tr>
            <tr id="row0" data-index="0">
                <td>
                    <pre><div id="chk0" class="dpl-checkbox"><span class="genericon genericon-show"></span></div>&nbsp;</pre>
                </td>
                <td>
                    <pre>1</pre>
                </td>
                <td>
                    <pre>Pump Assy</pre>
                </td>
                <td>
                    <pre>PM005300</pre>
                </td>
                <td>
                    <pre>RF</pre>
                </td>
                <td>
                    <pre>&nbsp;</pre>
                </td>
            </tr>
            <tr id="row1" data-index="1">
                <td>
                    <pre><div id="chk1" class="dpl-checkbox"><span class="genericon genericon-show"></span></div>&nbsp;</pre>
                </td>
                <td>
                    <pre>10</pre>
                </td>
                <td>
                    <pre>•Back Plate Assy</pre>
                </td>
                <td>
                    <pre>PM005301</pre>
                </td>
                <td>
                    <pre>1</pre>
                </td>
                <td>
                    <pre>&nbsp;</pre>
                </td>
            </tr>
            <tr id="row2" data-index="2">
                <td>
                    <pre><div id="chk2" class="dpl-checkbox"><span class="genericon genericon-show"></span></div>&nbsp;</pre>
                </td>
                <td>
                    <pre>130</pre>
                </td>
                <td>
                    <pre>•Casing</pre>
                </td>
                <td>
                    <pre>PM005350</pre>
                </td>
                <td>
                    <pre>1</pre>
                </td>
                <td>
                    <pre>&nbsp;</pre>
                </td>
            </tr>
            <tr id="row3" data-index="3">
                <td>
                    <pre><div id="chk3" class="dpl-checkbox"><span class="genericon genericon-show"></span></div>&nbsp;</pre>
                </td>
                <td>
                    <pre>280</pre>
                </td>
                <td>
                    <pre>•Face Plate Assy</pre>
                </td>
                <td>
                    <pre>PM005600</pre>
                </td>
                <td>
                    <pre>1</pre>
                </td>
                <td>
                    <pre>&nbsp;</pre>
                </td>
            </tr>
        </tbody>
    </table>
    */

    var colWidth = [],
        commands;

    var escapeHTML = require('lib/escape-html');

    function collectAllCommands(root) {
        if (!commands) {
            commands = {};
            root.$('ipc/figure/dplist/item').forEach(function (item) {
                item.$('commands/command').forEach(function (command) {
                    commands[command.$attr('id')] = command;
                });
            });
        }
    }

    function createColgroup(table) {
        colWidth = [];
        var entries = table.$('thead/row/entry');
        var totalWidth = entries.reduce(function (acc, entry, index, array) {
            var width = +entry.$attr('width') || 0;
            return acc + width;
        }, 0);
        var syntax = entries.reduce(function (syntax, entry, index, array) {
            var width = +entry.$attr('width') || 0;
            var w = Math.floor(width * 100 / totalWidth) + '%';
            colWidth.push({
                width: width,
                col: w
            });
            return syntax + '<col width="' + w + '">';
        }, '');
        return '<colgroup>' + syntax + '</colgroup>';
    }

    function createThead(table) {
        var entries = table.$('thead/row/entry');
        var syntax = entries.reduce(function (syntax, entry, i) {
            var columnId = entry.$attr('column-id'),
                columnIdAttr = columnId ? 'data-column-id="' + columnId + '"' : '';
            return syntax + '<td width="' + colWidth[i].col + '" ' + columnIdAttr + '><pre>' + escapeHTML(entry.$text('para')) + '</pre></td>';
        }, '');
        syntax = '<thead><tr>' + syntax + '</tr></thead>';
        return syntax;
    }

    function createTbody(rows) {
        var syntax = colWidth.reduce(function (syntax, entry) {
            var wbar = new Array(Math.max(1, entry.width) + 1).join('W');
            return syntax + '<td width="' + entry.col + '" class="strut"><div><pre>' + wbar + '</pre></div></td>';
        }, '<tr>') + '</tr>';

        syntax += rows.reduce(function (syntax, row, index) {
            var id = 'row' + index;
            var ref = row.$attr('refItem');
            var syntaxTr = row.$('entry').reduce(function (syntax, entry) {
                var text = escapeHTML(entry.$text('para')) || entry.$('cmdtext').reduce(function (syntax, cmdtext) {
                    return syntax + '<span class="command" data-ref="' + cmdtext.$attr('refCmd') + '" data-type="' + commands[cmdtext.$attr('refCmd')].$attr('type') + '">' + escapeHTML(cmdtext.$text()) + '</span>';
                }, '') || '&nbsp;';
                return syntax + '<td><pre>' + text.replace(/^([\r\n])/, '&nbsp;$1') + '</pre></td>';
            }, '<tr id="' + id + '" data-ref="' + ref + '">') + '</tr>';
            return syntax + syntaxTr;
        }, '');

        syntax = '<tbody>' + syntax + '</tbody>';
        return syntax;
    }

    function getFullDPLTable(root) {
        var table = root.$('ipc/figure/ipc-table/table')[0],
            rows = table.$('tbody/row');

        collectAllCommands(root);

        var syntax = '<table id="dpl-table" class="dpl-table">';
        syntax += createColgroup(table);
        syntax += createThead(table);
        syntax += createTbody(rows);
        syntax += '</table>';

        return syntax;
    }

    function getDPLTable(root, activeRows) {
        var table = root.$('ipc/figure/ipc-table/table')[0],
            rows = table.$('tbody/row').filter(function (row, index) {
                return activeRows.indexOf(index) >= 0;
            });

        collectAllCommands(root);

        var syntax = '<table id="dpl-table" class="dpl-table">';
        syntax += createColgroup(table);
        syntax += createThead(table);
        syntax += createTbody(rows);
        syntax += '</table>';
        return syntax;
    }

    module.exports = {
        getFullDPLTable: getFullDPLTable,
        getDPLTable: getDPLTable
    };
});