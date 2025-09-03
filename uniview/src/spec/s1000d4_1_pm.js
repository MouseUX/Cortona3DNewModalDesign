/**
 * 
 */
define(function (require, exports, module) {
    require('css!./s1000d4_1_scpm.css');
    require('css!./s1000d4_1_pm.css');
    require('css!./s1000d/4_1/prc.css');
    module.exports = function (skin, options, solo) {

        var baseFileName = solo.uniview.ixml.json.$text('SimulationInteractivity/SimulationInformation/XMLFileName');
        var structureFileUri = encodeURI(baseFileName + '.structure.xml');

        var doc = solo.uniview.doc,
            src = doc.bundleURL ? solo.app.util.createResourceURL(structureFileUri) : solo.app.util.toUrl(structureFileUri, doc.baseURL);

        return solo.app.loadCompanionFile(src)
            .then(function (data) {
                return skin.use(require('uniview-structure'), solo.expand({
                    panel: solo.expand({
                        structure: options.panel.aux,
                        iframe: options.panel.main,
                    }, options.panel),
                    structureUrl: src,
                    structure: data
                }, options));
            });
    };
});