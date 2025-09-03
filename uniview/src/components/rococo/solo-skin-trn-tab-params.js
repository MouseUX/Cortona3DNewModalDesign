/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-tab-params.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var ixml = solo.uniview.ixml;

        var element = skin.div('.params');

        function varItemContent(variable) {
            return {
                id: variable.name,
                content: [
                    skin.text('', variable.trueName),
                    skin.text('', variable.type),
                    skin.text('', String(variable.defaultValueOf())),
                    skin.text('', String(variable.valueOf()))
                ]
            };
        }
    
        function getVariablesItems() {
            var res = [
                {
                    content: [
                        skin.text('', __("UI_VART_NAME")),
                        skin.text('', __("UI_VART_TYPE")),
                        skin.text('', __("UI_VART_INITV")),
                        skin.text('', __("UI_VART_VALUE"))
                    ]
                }
            ];
            for (var key in solo.training.variables) {
                res.push(varItemContent(solo.training.variables[key]));
            }
            return res;
        }

        function validateVariables() {
            skin.clear(element);
            element.append(skin.create(require('components/tree'), {
                items: getVariablesItems()
            }).$el);
        }

        solo.on('training.didChangeExpectedOperations', validateVariables);
        solo.on('training.didScenarioOperations', validateVariables);

        validateVariables();

        return this.exports(element);
    };
});