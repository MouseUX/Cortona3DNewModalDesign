/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-figure-location.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;

        var viewpoints = solo.training.interactivity.json.$('scenario/viewpoints/viewpoint').map(function (viewpoint) {
            return {
                description: viewpoint.$text('description'),
                value: viewpoint.$text('viewpoint-value')
            };
        });
        var onchange = function () {
                solo.training.setViewpointValue(this.value);
            },
            selector = skin.select({
                    onclick: onchange,
                    onchange: onchange
                },
                viewpoints
            ),
            element = skin.label('.location.cortona3dsolo-popover',
                __("UI_TXT_LOCATION"),
                selector
            );

        skin.toggle(element, viewpoints.length);

        solo.on('training.didStartScenarioStep', function (step) {
            var stepViewpoints = step.viewpoints.array.map(function (viewpoint) {
                    return {
                        description: viewpoint.description,
                        value: viewpoint.value.join(' ')
                    };
                }),
                newViewpoints = viewpoints.concat(stepViewpoints),
                newSelector = skin.select({
                        onclick: onchange,
                        onchange: onchange
                    },
                    newViewpoints
                );
            element.replaceChild(
                newSelector,
                selector
            );
            selector = newSelector;
            skin.toggle(element, newViewpoints.length);
        });

        return this.exports(element);
    };
});