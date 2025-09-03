/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop willSkipAlert {function}
 * @prop willReturnAlertTitle {function}
 * @prop willReturnAlertBody {function}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-question-alert-modal.css');

    var uiModal = require('components/modal');

    function isFunction(f) {
        return typeof f === 'function';
    }

    module.exports = function (skin, options, solo) {

        var i18n = solo.uniview.i18n["solo-skin-question"];

        function confirm(content) {
            return new Promise(function (resolve, reject) {
                var buttonYes = skin.button({
                        onclick: function () {
                            skin.emit('modal.close');
                            resolve(true);
                        }
                    }, i18n["UI_BTN_YES"]),
                    buttonNo = skin.button({
                        onclick: function () {
                            skin.emit('modal.close');
                            resolve(false);
                        }
                    }, i18n["UI_BTN_NO"]),
                    modal = skin.render(uiModal, {
                        hideDismissButton: true,
                        disableAutoDismiss: true,
                        content: content,
                        footerContent: skin.container('.buttons-group',
                            buttonYes,
                            buttonNo
                        )
                    });
                modal.$el.tabIndex = 0;
                modal.$el.addEventListener('focus', function () {
                    buttonNo.focus();
                });
                modal.$el.focus();
            });
        }

        function processAlert(alert) {
            var component = this;

            if (!(isFunction(options.willSkipAlert) ? options.willSkipAlert(alert) : false)) {
                var documentAlertBody = (isFunction(options.willReturnAlertBody) && options.willReturnAlertBody(alert)) || '';
                var modal;

                if (alert.type == 'confirm') {

                    confirm(i18n.notAllAnswersAnswered)
                        .then(function (result) {
                            if (result) {
                                //Yes button
                                solo.dispatch('uniview.doc.confirmAnswer.OK');
                            } else {
                                //No button
                                solo.dispatch('uniview.doc.confirmAnswer.Cancel');
                            }
                        });

                } else {
                    modal = skin.render(uiModal, {
                        hideDismissButton: false,
                        title: isFunction(options.willReturnAlertTitle) ? options.willReturnAlertTitle(alert) : "",
                        content: documentAlertBody || skin.span({
                            innerHTML: alert.description
                        })
                    });
                    skin.append(modal);
                    modal.$el.focus();
                    modal.once('closed', function () {
                        //component.dispatch('close');
                    });
                }
            }
        }

        solo.on('uniview.doc.wrongAnswer', function (attemps, wrongType) {
            var str = '';
            if (wrongType == 'notFullAnswer') {
                str = i18n.notFullAnswer;
            } else if (wrongType == 'nothingChoose') {
                str = i18n.nothingChoose;
            } else {
                str = i18n.wrongAnswer;
            }

            if (attemps) {
                str = str + '. ' + i18n.checkAttemps + attemps;
            }

            processAlert({
                description: str
            });
        });

        solo.on('uniview.doc.confirmAnswer', function (text) {
            processAlert({
                description: text,
                type: "confirm"
            });
        });

        this.on('show', processAlert);
    };
});

/**
 * It is used to show wrong answer modal window.
 * @event Cortona3DSolo~"uniview.doc.wrongAnswer"
 * @type {arguments} 
 * @prop {number} attemps
 * @prop {string} wrongType -
 * - notFullAnswer - not all correct answers are selected 
 * - nothingChoose - select at least one answer 
 */

/**
 * It is used to show confirm answer modal window.
 * @event Cortona3DSolo~"uniview.doc.confirmAnswer"
 * @type {arguments}
 * @prop {string} text - text for confirm window
 */