/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop logoSrc {string}
 * @prop printHeader {object}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-dpl-header.css');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['solo-skin-ipc-dpl-header'] || {};

        if (solo.uniview.doc.type !== "ipc") return;

        function _00(n) {
            n = n || 0;
            return (n < 10) ? '0' + n : n;
        }

        function formatDate(date) {
            // date: MM/DD/YY
            var d = new Date(date);

            // IE11 fix
            var yy = +date.split('/').pop();
            d.setFullYear((yy < 50 ? 2000 : 1900) + yy);

            // return: YYYY-MM-DD
            return d.getFullYear() + '-' + _00(d.getMonth() + 1) + '-' + _00(d.getDate());
        }

        var meta = solo.uniview.metadata,
            opt = solo.uniview.ixml.getOptions(),
            m_sheetTextNode = skin.text({}, solo.app.ipc.getCurrentSheet().description),
            printHeader = solo.expand({
                description: i18n.title,
                title: meta.TITLE,
                sheetLabel: i18n.sheet,
                date: opt.ModificationDate ? (i18n.date + ' ' + formatDate(opt.ModificationDate)) : ''
            }, options.printHeader || {});

        options.printHeader = printHeader;

        var element = skin.container('.skin-ipc-dpl-header.direction-row',
            skin.container('.direction-column.logo-container',
                options.logoSrc && skin.create('img.logo', {
                    src: options.logoSrc
                })
            ),
            skin.container('.direction-column.left',
                skin.p('.title', printHeader.description),
                skin.p('.subtitle', printHeader.title),
                skin.p('.mono.low', printHeader.sheetLabel, " ", m_sheetTextNode)
            ),
            skin.container('.direction-column.right',
                skin.text('.mono.low', printHeader.date)
            )
        );

        solo.on('app.ipc.didSelectSheet', function (currentSheetInfo) {
            m_sheetTextNode.textContent = currentSheetInfo.description;
        });

        return this.exports(element);
    };
});