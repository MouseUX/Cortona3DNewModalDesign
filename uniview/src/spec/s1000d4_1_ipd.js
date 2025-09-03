define(function (require, exports, module) {
    var CSN = require('./lib/s1000d-coding').CSN,
        DMC = require('./lib/s1000d-coding').DMC;

    module.exports = function (skin, options, solo) {
        require('./lib/s1000d-validate-metadata');

        var ixml = solo.uniview.ixml,
            meta = solo.uniview.metadata,
            ipdDMC = new DMC({
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
                itemLocationCode: meta.ILC
            });

        var re = /^(.*\s)?((?:[0-9A-Z]+-)+(?:[0-9A-Z]+)(?:\/[0-9A-Z]{3})?)(.*)?$/m;

        solo.on('uniview.dpl.didSetupReferenceCommand', function (el, span) {
            var text = span.textContent.replace(/(CSN|CSN\/ISN)\s*[\r\n]+\s*/g, '$1 ').replace(/\s*[\r\n]+\s*/g, ''),
                a = re.exec(text);
            if (a) {
                var prefix = a[1],
                    anchor = a[2],
                    postfix = a[3],
                    csn,
                    dmc,
                    item;

                switch (span.dataset.type) {
                    case 'DMREF':
                    case 'RTX_DMREF':
                        dmc = new DMC(anchor);
                        break;
                    default:
                        var command = ixml.getCommandById(span.dataset.ref),
                            startCSN = {
                                REPLACEDBYCSN: 0,
                                OPTIONALCSN: 0,
                                SPARECSN: 0,
                                ALTEREDFROMCSN: 0,
                                LFMCSN: 0,
                                CTL2: 0,
                                RTX_CSNREF: 1,
                            } [span.dataset.type] || 0,
                            mi = command.$('value')[startCSN].$text(),
                            sdc = command.$('value')[startCSN + 1].$text();

                        if (anchor.split('-').length > 2) {
                            anchor = [mi, sdc, anchor].join('-');
                        }

                        csn = new CSN(anchor, ipdDMC);
                        item = csn.toString().split('-').pop();
                        dmc = csn.toDMC();
                }

                item = item || '';

                el.dataset.dmc = dmc;
                el.dataset.item = item;

                el.href = solo.app.util.toUrl(dmc + '.htm' + (item && '#' + item));
            }
        });

        return skin.use(require('./lib/catalog-s1000d'), solo.expand({
            disableSetupReferenceCommand: true,
            dplReferenceCommands: [
                'REPLACEDBYCSN',
                'OPTIONALCSN',
                'SPARECSN',
                'ALTEREDFROMCSN',
                'LFMCSN',
                'CTL2',
                'RTX_CSNREF',
                'RTX_DMREF',
                'DMREF'
            ]
        }, options));
    };
});