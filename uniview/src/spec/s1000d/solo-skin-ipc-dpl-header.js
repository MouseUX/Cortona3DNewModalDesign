/**
 * :logoSrc
 * :printHeader ={}
 */

define(function (require, exports, module) {
    require('css!./solo-skin-ipc-dpl-header.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            meta = solo.uniview.metadata,
            i18n = solo.uniview.i18n['s1000d/solo-skin-ipc-dpl-header'] || {},
            DMC = require('../lib/s1000d-coding').DMC;

        function _00(n) {
            n = n || 0;
            return (n < 10) ? '0' + n : n;
        }

        function _000(n) {
            n = n || 0;
            return (n < 100) ? '0' + _00(n) : n;
        }

        function getDMCCode() {
            return new DMC({
                modelIdentCode: meta.MI,
                systemDiffCode: meta.SDC,
                systemCode: meta.SYSTEM,
                subSystemCode: meta.SUBSYSTEM.substring(0, 1),
                subSubSystemCode: meta.SUBSYSTEM.substring(1),
                assyCode: meta.UNIT,
                disassyCode: meta.DC,
                disassyCodeVariant: meta.DCV,
                infoCode: meta.IC,
                infoCodeVariant: meta.ICV,
                itemLocationCode: meta.ILC,
                learnCode: meta.LEARNCODE,
                learnEventCode: meta.LEARNEVENTCODE
            }).toString();
        }

        var m_sheetTextNode = skin.text({}, solo.app.ipc.getCurrentSheet().description),
            m_figVariant = (+meta.DCV === 0) ? '' : meta.DCV;
            printHeader = solo.expand({
                description: i18n.title,
                title: getDMCCode(),
                subtitle: [
                    i18n.figure + ' ' + meta.DC + m_figVariant,
                    meta.FIGURETITLE || meta.TITLE
                ],
                sheetLabel: i18n.sheet,
                revision: i18n.rev + ' ' + _000(meta.ISSUE_NO) + '.' + _00(meta.ISSUE_REVNO),
                effectivity: i18n.model + ' ' + (meta.APPLIC_DESCR || i18n.all)
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
                    skin.text('', printHeader.subtitle[0]),
                    skin.text('.sheet', printHeader.subtitle[1])
                ),
                skin.container('.mono.low',
                    skin.text('',
                        i18n.sheet, ' ', m_sheetTextNode
                    )
                )
            ),
            skin.container('.direction-column.right',
                skin.text('.mono.bot', i18n.model, ' ', meta.APPLIC_DESCR || i18n.all),
                skin.text('.mono.bot', i18n.rev, ' ', _000(meta.ISSUE_NO), '.', _00(meta.ISSUE_REVNO))
            )
        );

        solo.on('app.ipc.didSelectSheet', function (currentSheetInfo) {
            m_sheetTextNode.textContent = currentSheetInfo.description;
        });

        return this.exports(element);
    };
});