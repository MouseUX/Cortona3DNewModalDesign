/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-figure-toolbar-top.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var i18n = solo.uniview.i18n['solo-skin-procedure-toolbar'] || {};

        solo.expand(i18n, solo.uniview.i18n['solo-skin-trn-figure-toolbar']);

        var viewpoints = solo.training.interactivity.json.$('scenario/viewpoints/viewpoint')
            .map(function (viewpoint) {
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
            location = skin.label('.location.cortona3dsolo-popover',
                __("UI_TXT_LOCATION"),
                selector
            );

        skin.toggle(location, viewpoints.length);

        solo.on('training.didStartScenarioStep', function (step) {
            var stepViewpoints = step.viewpoints.array
                .map(function (viewpoint) {
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
            location.replaceChild(
                newSelector,
                selector
            );
            selector = newSelector;
            skin.toggle(location, newViewpoints.length);
        });

        var indicator = skin.div('.mode');

        solo.on('training.didStartScenario', function (mode) {
            skin.show(indicator);
            indicator.innerText = __("MODE" + "_" + ["DEMO", "STUDY", "EXAM"][mode]);
        });

        function hideModeIndicator() {
            skin.hide(indicator, true);
        }

        hideModeIndicator();

        solo.on('training.didCancelScenario', hideModeIndicator);
        solo.on('training.didFinishScenario', hideModeIndicator);

        var element = skin.toolbar('main.top',
            skin.container('.left',
                location
            ),
            skin.container('.right',
                indicator
            )
        );

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            if (drawingMode) {
                element.classList.add('display-mode-2d');
            } else {
                element.classList.remove('display-mode-2d');
            }
        });
        
        return this.exports(element);
    };
});