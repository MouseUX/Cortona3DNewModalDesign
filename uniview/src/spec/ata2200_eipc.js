define(function (require, exports, module) {

    function _00(n) {
        n = n || 0;
        return (n < 10) ? '0' + n : n;
    }

    module.exports = function (skin, options, solo) {
        require('addons/catalog');

        var meta = solo.uniview.metadata,
            i18n = solo.uniview.i18n['catalog-ata2200'] || {};

        return skin.use(require('./lib/catalog-ata2200'), solo.expand({
            model: meta._770CABEAA00D41AF8CA0D4177F421FA5,
            figure: _00(meta._0FC9A6FF29C44ac4AF83A6EB44460FAA) + (meta._5A652A33F5C84a1dA84FB9B90F3044D1 || ''),
            filter: [{
                name: 'model',
                label: i18n.filterModel,
                values: [{
                        description: i18n.all,
                        value: '*'
                    }]
                    .concat(solo.catalog.filter.valuesCommand('MODAPPLY').reduce(function (acc, value) {
                            return acc.concat(value.split(' '));
                        }, [])
                        .concat(solo.catalog.filter.valuesCommand('MODAPPLYITEM').reduce(function (acc, value) {
                            return acc.concat(value.split(' '));
                        }, []))
                        .reduce(function (acc, value) {
                            if (value && acc.indexOf(value) < 0) {
                                acc.push(value);
                            }
                            return acc;
                        }, [])
                    ),
                test: function (info, value, explicitly) {
                    var commands = info.commands.filter(function (command) {
                        return command.type === 'MODAPPLY' || command.type === 'MODAPPLYITEM';
                    });
                    var res = false;
                    if (!explicitly) {
                        res = !commands.length;
                    }
                    return res || commands.some(function (command) {
                        return command.args[0] === value || command.args[0].split(' ').indexOf(value) >= 0;
                    });
                }
            }, {
                name: 'usage',
                label: i18n.filterUsage,
                values: [{
                    description: i18n.all,
                    value: '*'
                }].concat(solo.catalog.filter.valuesMeta('_8143AB2D073646f5B66D4A5C35A184C6')),
                test: solo.catalog.filter.testMeta.bind(solo, '_8143AB2D073646f5B66D4A5C35A184C6')
            }, {
                name: 'sb',
                label: i18n.filterSB,
                values: [{
                        description: i18n.all,
                        value: '*'
                    }]
                    .concat(
                        solo.catalog.filter.valuesCommand('SBREF'),
                        solo.catalog.filter.valuesCommand('POSTSB'),
                        solo.catalog.filter.valuesCommand('DELBYSB')
                    )
                    .reduce(function (acc, value) {
                        if (value && acc.indexOf(value) < 0) {
                            acc.push(value);
                        }
                        return acc;
                    }, []),
                test: function (info, value, explicitly) {
                    return info.commands.some(function (command) {
                        return (command.type === 'SBREF' || command.type === 'POSTSB' || command.type === 'DELBYSB') && command.args[0] === value;
                    });
                }
            }]
        }, options));
    };
});