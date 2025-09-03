/**
 * 
 */
define(function (require, exports, module) {
    require('css!./solo-skin-sco-tab-trainingStep.css');

    module.exports = function (skin, options, solo) {

        var docLinks = require('actions/doc-links');
        var docResolve = skin.create(require('components/doc-resolve'), solo.expand({
            handlers: {
                link2d: function () {
                    docLinks.link2d.call(this);
                },
                link3d: function () {
                    docLinks.link3d.call(this);
                },
                footnote: function () {
                    docLinks.footnote.call(this);
                }
            }
        }, options));

        var element = skin.div('.doc-container');

        docResolve.documentTemplateHtml()
            .then(function (syntax) {

                var div = skin.div();
                div.innerHTML = syntax;

                var trainingStep = div.querySelector('.trainingStep[id = "' + options.traingStepId + '"]');
                element.append(trainingStep);
                //element.append.apply(element, trainingStep);
                docResolve.resolveImages(element);
                docResolve.resolveLinks(element);

                var deleteElements = trainingStep.querySelectorAll('.trainingStep>.contentDescription');
                for (var i = 0; i < deleteElements.length; i++) {
                    var item = deleteElements.item(i);
                    item.parentElement.removeChild(item);
                }
                /*
                deleteElements.forEach(function (item, i, arr) {
                    item.parentElement.removeChild(item);
                });*/

                solo.dispatch('uniview.sco.tabLoaded', options.traingStepId);

                //div = null;

            })
            .catch(function (e) {
            });

        return this.exports(element);
    };
});