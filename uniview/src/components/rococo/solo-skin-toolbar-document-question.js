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

    module.exports = function (skin, options, solo) {
        
        var i18n = solo.uniview.i18n["solo-skin-question"];
        
        var uiButtonExpand = require('./ui/btn-expand');

        var container = skin.container('.right');

        var submitAllAnswersButton = skin.button({
            onclick: function () {
                solo.dispatch('uniview.doc.submitAllAnswers');
            }
        }, i18n.UI_BTN_submitAllAnswer);
        var submitAnswerButton = skin.button({
            onclick: function() {
                solo.dispatch('uniview.doc.submitAnswer');
            }
        }, i18n.UI_BTN_Answer);
        var previousSlideButton = skin.button({
            onclick: function() {
                solo.dispatch('uniview.doc.showPreviousOrNextSlide', 'previous');
            }
        }, i18n.UI_BTN_Previous);
        var nextSlideButton = skin.button({
            onclick: function() {
                solo.dispatch('uniview.doc.showPreviousOrNextSlide', 'next');
            }
        }, i18n.UI_BTN_Next);
        
        container.append(submitAnswerButton, previousSlideButton, nextSlideButton);
        
        container.append(
            options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
                panelName: 'Aux'
            }).element
        );

        var leftContainer = skin.container('.left');
        leftContainer.append(submitAllAnswersButton);

        var element = skin.toolbar('.main.top',
            leftContainer,
            container
        );

        solo.on('uniview.doc.changeQuestionSlide', function(state) {
            submitAnswerButton.disabled = !state.answer;
            nextSlideButton.disabled = !state.next;
            previousSlideButton.disabled = !state.previous;
        });

        solo.on('uniview.doc.slidePassed', function () {
            submitAnswerButton.disabled = true;
        });

        solo.on('uniview.doc.allSlidesPassed', function () {
            submitAnswerButton.disabled = true;
            submitAllAnswersButton.disabled = true;
        });

        return this.exports(element);
    };
});