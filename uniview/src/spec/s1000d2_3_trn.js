define(function (require, exports, module) {
    require('css!./s1000d/2_3/prc.css');

    module.exports = function (skin, options, solo) {
        var lang = solo.uniview.metadata.LANG || 'en';

        var cssName = "s1000d_2_3.css";
        solo.app.util.requirePromise("css!static/i18n/" + lang + "/" + cssName)
            .catch(function () {
                return solo.app.util.requirePromise("css!static/i18n/en/" + cssName);
            });

        var docLinks = require('actions/doc-links');

        return skin
            .render(require('uniview-training'), solo.expand({
                getScenarioTitle: function (dmodule) {
                    var techname = dmodule.querySelector('.idstatus>.dmaddres>.dmtitle>.techname'),
                        title;

                    if (techname) {
                        title = techname.innerText;
                    }
                    return title;
                },
                handlers: {
                    link3d: function () {
                        solo.app.procedure.toggleDrawingDisplayMode(false);
                    },
                    link2d: function () { 
                        docLinks.link2d.call(this);
                    },
                    toggleStatus: function () {
                        var n = this.getElementsByClassName('dmStatus');
                        if (n.length) {
                            n[0].style.display = (n[0].style.display !== 'block') ? 'block' : 'none';
                        }
                    }
                }
            }, options));
    };
});