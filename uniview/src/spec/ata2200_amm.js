define(function (require, exports, module) {
    require('css!./ata2200/amm.css');
    //require('css!./ata2200_amm.css');

    module.exports = function (skin, options, solo) {

        var lang = solo.uniview.metadata.LANG || 'en';

        var cssName = "ata2200.css";
        solo.app.util.requirePromise("css!static/i18n/" + lang + "/" + cssName)
            .catch(function () {
                return solo.app.util.requirePromise("css!static/i18n/en/" + cssName);
            });

        solo.on('app.procedure.didEnterSubstepWithName', options.univiewDocActivate || function (substepid) {
            var idStep = solo.app.procedure.getContextItemId(substepid),
                idSubstep = solo.app.procedure.getActiveItemId(substepid);
            solo.dispatch('uniview.doc.activate', idStep, idSubstep);
        });

        solo.on('uniview.doc.didLoadComplete', function (element) {
            var ixml = solo.uniview.ixml,
                prc = document.getElementById(ixml.getProcedureId());
            if (prc) {
                prc.classList.add('Procedure');
            }
        });

        return skin.use(require('uniview-procedure-with-document'), solo.expand({
            filterComponent: null
        }, options));
    };
});