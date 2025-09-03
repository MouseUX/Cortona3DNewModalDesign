define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        require("css!./tcsp_workcard.css");

        solo.on('uniview.doc.didLoadComplete', function (element) {
            var documentElement = element.querySelector('*[data-class~="topic/topic"][data-lang]');
            var lang = ((documentElement && documentElement.dataset.lang) || solo.uniview.options.SpecLang || 'en').split('-')[0];
            var cssName = "tcsp_workcard.css";
            solo.app.util.requirePromise("css!static/i18n/" + lang + "/" + cssName)
                .catch(function () {
                    return solo.app.util.requirePromise("css!static/i18n/en/" + cssName);
                });
            solo.app.util.requirePromise("css!static/i18n/" + lang + "/dita_notes.css")
                .catch(function () {
                    return solo.app.util.requirePromise("css!static/i18n/en/dita_notes.css");
                })
                .catch(console.error.bind(console));
        });

        return skin.use(require('./dita_task'), solo.expand({
            skipDitaLocaleCss: true,
            univiewDocActivate: function (substepid) {
                var ixml = solo.uniview.ixml;
                var topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                    topic_id = topic ? topic.id : ixml.getProcedureId(),
                    idStep = topic_id + '__' + solo.app.procedure.getContextItemId(substepid),
                    idSubstep = topic_id + '__' + (ixml.getProcedureItemInfo(substepid) || {}).parent;
                solo.dispatch('uniview.doc.activate', idStep, idSubstep);
            }
        }, options));
    };
});