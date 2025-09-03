/**
 * 
 */
define(function (require, exports, module) {

    module.exports = function (skin, options, solo) {

        var i18n = solo.uniview.i18n['uniview-structure'] || {};

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item'),
            applicResources = require('spec/s1000d/applic/applicResources');

        var element = skin.create('.pct-filter'),
            selectFilterField = {},
            clearFilterButton = {};

        var pct,
            pctValues = [],
            loadFiterPCTState = 0;

        try {

            pct = applicResources.getResource('pct');
            if (pct.products.length) {
                pctValues.push({
                    value: 'noProduct',
                    description: i18n.UI_TXT_SELECT_NO_PRODUCT
                });
                pct.products.forEach(function (product) {
                    pctValues.push({
                        value: product.id,
                        description: product.resolve('%resolveStr')
                    });
                });
            }
        } catch (e) { }

        if (!pctValues.length) {
            return this.exports(element);
        }

        selectFilterField = skin.create(uiSettingsItem, {
            name: 'FilterPCT',
            type: 'select',
            label: i18n.UI_TXT_PCT,
            value: pctValues[0].value,
            choice: pctValues,
            onchange: function (value) {
                if (!loadFiterPCTState) {
                    loadFiterPCTState = 1;
                    clearFilterButton.disabled = true;
                }
                clearFilterButton.disabled = false;
                var pctProduct = pct.getProductByArgs({ id: value });
                var pctFilter;
                if (pctProduct) {
                    pctFilter = {
                        products: [pctProduct]
                    };
                }
                solo.dispatch('structure.applyPCTFilter', pctFilter);
            }
        });

        clearFilterButton = skin.button({
            title: i18n.UI_BTN_CLEAR_FITLER_TITLE,
            onclick: clearFilter
        }, i18n.UI_BTN_CLEAR);

        function clearFilter() {
            solo.dispatch('uniview.settings.setFilterPCT'); //set "no product" to PCT filter
        }

        var toolbar = skin.toolbar('.pct-toolbar.main',
            skin.container('.left', selectFilterField),
            skin.container('.right', [
                clearFilterButton
            ])
        );

        element.append(toolbar);

        solo.on('structure.applyPCTFilter', function (pctFilter) {

            toolbar.classList.remove('applied');
            clearFilterButton.disabled = true;

            if (pctFilter) {
                toolbar.classList.add('applied');
                clearFilterButton.disabled = false;
            }
        });

        return this.exports(element);
    };
});