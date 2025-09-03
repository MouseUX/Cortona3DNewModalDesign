/**
 * :model
 * :logoSrc
 * :printHeader ={}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-dpl-header.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['ata2200/solo-skin-ipc-dpl-header'] || {};

        function _00(n) {
            n = n || 0;
            return (n < 10) ? '0' + n : n;
        }

        function formatUSDate(s) {
            s = (s || '').trim();
            var res = s;
            if (typeof s === 'string' && s.length === 8) {
                // 20100601 -> Jun 01/10
                res = 'JanFebMarAprMayJunJulAugSepOctNovDec'.substr((s.substr(4, 2) - 1) * 3, 3) + ' ' + s.substr(6, 2) + '/' + s.substr(2, 2);
            }
            return res;
        }

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        var meta = solo.uniview.metadata,
            m_sheetTextNode = skin.text({}, solo.app.ipc.getCurrentSheet().description),
            printHeader = solo.expand({
                description: i18n.title,
                title: _00(meta._302B778AB60844a4AC6BDCD31C5566F2) + '-' +
                    _00(meta._6075008EF910457aB9C7AD0032853538) + '-' +
                    _00(meta._1482D808FEA94afeB6666F2CB8433A1A) + ' ' +
                    (meta._87F24245DF264B26989A16C3B4471D31 || ''),
                subtitle: i18n.figure + ' ' +
                    _00(meta._0FC9A6FF29C44ac4AF83A6EB44460FAA) +
                    (meta._5A652A33F5C84a1dA84FB9B90F3044D1 || ''),
                sheetLabel: i18n.sheet,
                revision: i18n.rev + ' ' + meta._1AD07A8E6C694c218ED8772B4D64E2C9,
                date: formatUSDate(meta._103112F2F5C4416f8146387F3B53B103),
                effectivity: options.model && (i18n.model + ' ' + options.model)
            }, options.printHeader || {});

        options.printHeader = printHeader;

        var element = skin.container('.skin-ipc-dpl-header.direction-row',
            skin.container('.direction-column',
                options.logoSrc && skin.create('img.logo', {
                    src: options.logoSrc
                })
            ),
            skin.container('.direction-column.left',
                skin.p('.title', printHeader.description),
                skin.p('.subtitle', printHeader.title),
                skin.container('.mono.low',
                    skin.text('', printHeader.subtitle),
                    skin.text('.sheet',
                        printHeader.sheetLabel, ' ', m_sheetTextNode
                    )
                )
            ),
            skin.container('.direction-column.right',
                skin.text('.mono.bot', printHeader.revision),
                skin.text('.mono.bot', printHeader.date),
                printHeader.effectivity && skin.text('.mono.bot', printHeader.effectivity)
            )
        );

        solo.on('app.ipc.didSelectSheet', function (currentSheetInfo) {
            m_sheetTextNode.textContent = currentSheetInfo.description;
        });

        return this.exports(element);
    };
});