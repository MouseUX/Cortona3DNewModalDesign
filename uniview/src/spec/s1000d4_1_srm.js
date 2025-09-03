define(function (require, exports, module) {

    require('css!./s1000d4_1_srm.css');

    module.exports = function (skin, options, solo) {
        require('./lib/s1000d-validate-metadata');

        solo.expand(solo.uniview.i18n['s1000d/solo-skin-ipc-dpl-header'], solo.uniview.i18n['s1000d/solo-skin-srm-dpl-header']);

        return skin.use(require('./lib/catalog-s1000d'), solo.expand({
            disableSetupReferenceCommand: true
        }, options));
    };
});