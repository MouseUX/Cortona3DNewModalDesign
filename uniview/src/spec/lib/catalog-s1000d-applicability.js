define(function (require, exports, module) {

    require('css!./catalog-s1000d-applicability.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['catalog-s1000d'] || {};
        metadata = solo.uniview.metadata;

        var filters = [];
        var testInlineApplicCommands = ixml.json.$('ipc/figure/dplist/item/commands/command').filter(function (command) {
            return command.$attr('type') == "APPLICREFID";
        })

        if (!testInlineApplicCommands.length) {
            return filters;
        }

        var pctFilter,
            inlineFilter;

        var PCT = require('spec/s1000d/applic/PCT'),
            ApplicClass = require('spec/s1000d/applic/Applic');

        function InlineApplicsIPD() {
            this.applics = [];
            this.isEmpty = true;
        }

        InlineApplicsIPD.prototype.init = function () {
            var parser = new DOMParser(),
                dom = parser.parseFromString(metadata['REFERENCEDAPPLICGROUP'], "application/xml"),
                root = solo.app.util.xmlToJSON(dom);

            this.applics = root.$('referencedApplicGroup/applic').map(function ($applic) {
                return new ApplicClass($applic);
            })

            if (this.applics.length) {
                this.isEmpty = false;
            }
        }

        InlineApplicsIPD.prototype.toIPDFilter = function () {

            if (this.isEmpty) {
                return;
            }

            var applics = this.applics;

            return {
                name: 'inline',
                permanent: true,
                label: i18n.filterInline,
                values: [{
                    description: i18n.all,
                    value: '*'
                }]
                    .concat(solo.catalog.filter.valuesCommand('APPLICREFID'))
                    .reduce(function (acc, value) {
                        if (value && acc.indexOf(value) < 0) {
                            acc.push(value);
                        }
                        return acc;
                    }, [])
                    .map(function (value) {
                        return typeof value === 'object' ? value : {
                            value: value,
                            description: applics
                                .find(function (applic) {
                                    return applic.id === value;
                                })
                                .toInlineApplicString()
                        };
                    }),
                test: function (info, value, explicitly) {
                    var commands = info.commands.filter(function (command) {
                        return command.type === 'APPLICREFID';
                    });
                    var res = false;
                    if (!explicitly) {
                        res = !commands.length;
                    }
                    return res || commands.some(function (command) {
                        return command.args[0] === value;
                    });
                }
            }
        }

        function PCTforIPD() {
            this.pctObject;
            this.products = [];
            this.isEmpty = true;
        }

        PCTforIPD.prototype.init = function (pctData) {
            //pctData from Global for unuview-structure (PM publication) or from metadata for preview 
            if (!pctData) {
                pctData = metadata['$PCTDATA'] && JSON.parse(metadata['$PCTDATA']) || { products: [] };
            }

            if (pctData && pctData.products) {

                this.pctObject = new PCT({ data: pctData });
                this.products = this.pctObject.products;
            }

            if (this.products.length) {
                this.isEmpty = false;
            }
        }

        PCTforIPD.prototype.toIPDFilter = function () {

            if (!this.products)
                return;

            var values = [{
                description: i18n.all,
                value: '*'
            }];

            this.products.forEach(function (product) {
                values.push({
                    description: product.toArrString().join(' '),
                    value: product.id
                });
            })

            return {
                name: 'pct',
                permanent: true,
                label: i18n.filterPCT,
                values: values,
                test: function (info, value, explicitly) {

                    var product = pctForIPD.products.find(function (product) {
                        return product.id === value;
                    });
                    if (!product) {
                        return true;
                    }

                    var commands = info.commands.filter(function (command) {
                        return command.type === 'APPLICREFID';
                    })

                    if (!commands.length) {
                        return true;
                    }

                    var applicRefId = commands && commands[0] && commands[0].args[0];
                    var inlineApplic = inlineApplics.applics.filter(function (applic) {
                        return applic.id == applicRefId;
                    })[0];

                    if (!inlineApplic) {
                        return false;
                    }

                    var filteredInlineApplic = inlineApplic.filteredByProduct(product);
                    if (filteredInlineApplic && !filteredInlineApplic.state) {
                        return false;
                    }
                    
                    return true;
                }
            }
        }

        var inlineApplics = new InlineApplicsIPD();
        inlineApplics.init();

        var pctForIPD = new PCTforIPD();
        pctForIPD.init();

        !inlineApplics.isEmpty && filters.push(inlineApplics.toIPDFilter());
        !pctForIPD.isEmpty && filters.push(pctForIPD.toIPDFilter());

        // process the list of IPC pages when changing the applicability filters
        solo.on('catalog.didChangeFilterValue', function (filterName, filterValue) {
            if (filterName !== 'pct' && filterName !== 'inline') return;

            var isValueExist = filterValue && filterValue !== '*',
                applicRefIds = isValueExist ? [filterValue] : [];

            if (filterName === 'pct') {
                var product = pctForIPD.products.find(function (product) {
                    return product.id === filterValue;
                });
                applicRefIds = inlineApplics.applics
                    .map(function (inlineApplic) { return inlineApplic.filteredByProduct(product) })
                    .filter(function (filteredInlineApplic) { return filteredInlineApplic && filteredInlineApplic.state; })
                    .map(function (filteredInlineApplic) { return filteredInlineApplic.id; });
                if (isValueExist) {
                    solo.uniview.settings.Filterinline = '*';
                }
            } else {
                if (isValueExist) {
                    solo.uniview.settings.Filterpct = '*';
                }
            }

            solo.catalog.filter.applicRefIds = applicRefIds;

            var select = document.querySelector('#options-sheet select'),
                visibleSheets = [];

            if (select) {
                var needChangePage = false;

                select.childNodes.forEach(function (option) {
                    var hidden = false;
                    if (applicRefIds.length) {
                        var metadata = ixml.getSheetInfo(option.value).metadata || {};
                        hidden = !!metadata.APPLICREFIDPAGE && (applicRefIds.indexOf(metadata.APPLICREFIDPAGE) < 0);
                    }
                    skin.toggle(option, !hidden);
                    if (!hidden) {
                        visibleSheets.push(option.value);
                    } else if (option.value === Cortona3DSolo.app.ipc.currentSheetInfo.id) {
                        needChangePage = true;
                    }
                });

                if (needChangePage && visibleSheets.length) {
                    solo.app.ipc.setCurrentSheet(visibleSheets[0], !solo.uniview.settings.SkipAnimation);
                }
            }
        });

        solo.on('uniview.applyPCTFilter', function (pctFilter) {
            solo.uniview.settings.Filterpct = pctFilter ? pctFilter.products[0].id : '*';
            solo.dispatch('uniview.settings.disableFilterpct', !!pctFilter);
            solo.dispatch('uniview.settings.disableFilterinline', !!pctFilter);
        });

        return filters;
    }
});