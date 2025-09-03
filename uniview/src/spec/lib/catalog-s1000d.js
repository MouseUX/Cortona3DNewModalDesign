/**
 * :disableSetupReferenceCommand
 */
define(function (require, exports, module) {
    require('css!./catalog-s1000d.css');

    var CSN = require('./s1000d-coding').CSN,
        DMC = require('./s1000d-coding').DMC;

    module.exports = function (skin, options, solo) {
        require('addons/catalog');
        require('./s1000d-validate-metadata');
        require('./s1000d-normalize-meta-applic');

        var applicFilters = skin.create(require('./catalog-s1000d-applicability'), options);

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
            }),
            i18n = solo.uniview.i18n['catalog-s1000d'] || {};

        if (!options.disableSetupReferenceCommand) {
            var re = /^(.*\s)?((?:[0-9A-Z]+-)+(?:[0-9A-Z]+)(?:\/[0-9A-Z]{3})?)(.*)?$/m;

            solo.on('uniview.dpl.didSetupReferenceCommand', function (el, span) {
                var text = span.textContent.replace(/(CSN|CSN\/ISN)\s*[\r\n]+\s*/g, '$1 ').replace(/\s*[\r\n]+\s*/g, ''),
                    a = re.exec(text);
                if (a) {
                    var prefix = a[1],
                        anchor = a[2],
                        csn = new CSN(anchor, ipdDMC),
                        postfix = a[3],
                        item = csn.toString().split('-').pop(),
                        dmc = csn.toDMC();

                    item = item || '';

                    el.dataset.dmc = dmc;
                    el.dataset.item = item;

                    el.href = solo.app.util.toUrl(dmc + '.htm' + (item && '#' + item));
                }
            });
        }

        solo.on('app.ipc.dpl.didSetupTable', function (dplTableElement) {
            var figureVariant = (+meta.DCV === 0) ? '' : meta.DCV,
                colCount = dplTableElement.querySelector('thead tr').cells.length,
                tr = skin.create('tr.fig'),
                td, i;

            for (i = 0; i < colCount; i++) {
                td = tr.appendChild(skin.create('td'));
                if (i === 1) {
                    td.append(skin.create('pre', {}, meta.DC + figureVariant));
                }
            }

            dplTableElement.querySelector('thead').append(tr);
        });

        var modelFilter = {
            name: 'model',
            label: i18n.filterModel,
            values: [{
                description: i18n.all,
                value: '*'
            }]
                .concat(solo.catalog.filter.valuesCommand('MOVEFY'))
                .reduce(function (acc, value) {
                    if (value && acc.indexOf(value) < 0) {
                        acc.push(value);
                    }
                    return acc;
                }, []),
            test: function (info, value, explicitly) {
                var commands = info.commands.filter(function (command) {
                    return command.type === 'MOVEFY';
                });
                var res = false;
                if (!explicitly) {
                    res = !commands.length;
                }
                return res || commands.some(function (command) {
                    return command.args[0] === value;
                });
            }
        };

        var usageFilter = {
            name: 'usage',
            label: i18n.filterUsage,
            values: [{
                description: i18n.all,
                value: '*'
            }].concat(solo.catalog.filter.valuesMeta('UCA').filter(function (value) {
                return value.length === 1;
            })),
            test: function (info, value, explicitly) {
                var v = info.metadata.UCA || '';
                var res = false;
                if (!explicitly) {
                    res = !v;
                }
                return res || v.indexOf(value) >= 0;
            }
        };

        var sbFilter = {
            name: 'sb',
            label: i18n.filterSB,
            values: [{
                description: i18n.all,
                value: '*'
            }]
                .concat(
                    solo.catalog.filter.valuesCommand('CAN'),
                    solo.catalog.filter.valuesCommand('CAN2', 1)
                )
                .reduce(function (acc, value) {
                    if (value && acc.indexOf(value) < 0) {
                        acc.push(value);
                    }
                    return acc;
                }, []),
            test: function (info, value, explicitly) {
                return info.commands.some(function (command) {
                    return (command.type === 'CAN' && command.args[0] === value) || (command.type === 'CAN2' && command.args[1] === value);
                });
            }
        }

        var filters = [];
        if (applicFilters.length) {
            //applicability filters
            filters = filters.concat(applicFilters);
        } else {
            //else model filter
            filters.push(modelFilter);
        }

        filters.push(usageFilter);
        filters.push(sbFilter);

        return skin
            .use(require('uniview-ipc'), solo.expand({
                components: {
                    uiDplHeader: require('../s1000d/solo-skin-ipc-dpl-header')
                },
                logoSrc: '',
                filter: filters,
                sheetsFilter: function (sheetInfo) {
                    var hidden = false;
                    var applicRefIds = solo.catalog.filter.applicRefIds;
                    if (applicRefIds && applicRefIds.length) {
                        var metadata = sheetInfo.metadata || {};
                        hidden = !!metadata.APPLICREFIDPAGE && (applicRefIds.indexOf(metadata.APPLICREFIDPAGE) < 0);
                    }
                    return !hidden;
                },

                transformPrintHeader: function () {
                    this.subsubtitle = this.dismissSheetTitle ? [] : this.sheetLabel + ' ' + this.sheetInfo.description;
                    return this;
                },
                dplReferenceCommands: ["REF_NHA", "REF_DET", "REF_CSN"]
            }, options.enableMultiLinkByCSN ? {
                multiLink: true,
                disableDefaultMultiLinkCondition: true,
                testMultiLinkCondition: function (info, infoSrc) {
                    return (info.roles[3] + info.roles[4]) === (infoSrc.roles[3] + infoSrc.roles[4]);
                }
            } : {}, options))
            .then(function () {
                if (location.search.indexOf('mode=scorm') !== -1 || options.scormMode) {

                    console.log("*** SCORM mode switch ON ***");

                    solo.training = {
                        sco: require('addons/training/sco'),
                        hasQuestions: false
                    };

                    solo.training.sco.loadPageExpand();

                    window.addEventListener('beforeunload', function () {
                        solo.training.sco.unloadPageExpand();
                    });
                }

                skin.use(require('./s1000d-resolve-link'), solo.expand(options, {
                    linkSelector: 'a[data-dmc]'
                }));

                if (options.pctFilter) {
                    solo.dispatch('uniview.applyPCTFilter', options.pctFilter);
                }
            });
    };
});