/**
 * @uniview.doc.submitAllAnswers
 * @uniview.doc.submitAnswer
 * @uniview.doc.showPreviousOrNextSlide
 * 
 * =@uniview.doc.changeQuestionSlide({answer: false, next: false, previous: false})
 * =@uniview.doc.slidePassed
 * =@uniview.doc.allSlidesPassed
 * 
 * .element
 * 
 */
define(function (require, exports, module) {
    require('css!./solo-skin-structure-navigate-toolbar.css');

    module.exports = function (skin, options, solo) {
        var svgAssets = skin.create(require('./solo-skin-svg-assets'));
        
        var i18n = solo.uniview.i18n["uniview-structure"];
        var uiSettingsItem = require('components/rococo/solo-skin-settings-item');
        
        var structureToggleButton = skin.create(uiSettingsItem, {
            type: 'button',
            name: 'NavigationPanel',
            value: true,
            label: i18n.UI_BTN_TOOGLESTRUCTURE_OFF,
            title: i18n.UI_BTN_TOOGLESTRUCTURE_OFF_TITLE,
            onchange: function (value) {
                structureToggleButton.classList.remove('checked');
                structureToggleButton.innerHTML = value ? i18n.UI_BTN_TOOGLESTRUCTURE_OFF : i18n.UI_BTN_TOOGLESTRUCTURE_ON;
                structureToggleButton.title = value ? i18n.UI_BTN_TOOGLESTRUCTURE_OFF_TITLE : i18n.UI_BTN_TOOGLESTRUCTURE_ON_TITLE;
                solo.dispatch('uniview.toggleMainPanelOnlyMode', !value);
            }
        });

        var structurePreviousButton = skin.button({
            title: i18n.UI_BTN_UP_TITLE,
            onclick: function () {
                solo.dispatch('structure.navigate.previous');
            }
        }, skin.html(svgAssets.tr_left));

        var structureFollowingButton = skin.button({
            title: i18n.UI_BTN_DOWN_TITLE,
            onclick: function () {
                solo.dispatch('structure.navigate.following');
            }
        }, skin.html(svgAssets.tr_right));
        
        var element = skin.toolbar('.navigate-toolbar.main',
            skin.container('.left', [
                structureToggleButton,
                structurePreviousButton, 
                structureFollowingButton
            ]),
            skin.container('.right')
        );

        solo.on('structure.navigate.changeBtnState', function(state) {
            structurePreviousButton.disabled = !state.previous;
            structureFollowingButton.disabled = !state.following;
            solo.dispatch('uniview.toggleMainPanelOnlyMode', !solo.uniview.settings.NavigationPanel);
        });

        return this.exports(element);
    };
});