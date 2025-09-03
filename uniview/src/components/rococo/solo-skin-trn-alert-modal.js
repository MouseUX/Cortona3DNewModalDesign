/**
 * @close
 */
/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop willSkipAlert {function}
 * @prop willReturnAlertBody {function}
 * @prop willReturnAlertTitle {function}
 */
define(function (require, exports, module) {
    //require('css!./solo-skin-trn-alert-modal.css');

    var uiModal = require('components/modal');

    function isFunction(f) {
        return typeof f === 'function';
    }

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;

        function processAlert(activity) {
            var component = this;

            if (!(isFunction(options.willSkipAlert) ? options.willSkipAlert(activity) : false)) {
                var documentAlertBody = (isFunction(options.willReturnAlertBody) && options.willReturnAlertBody(activity)) || '',
                    modal = skin.create(uiModal, {
                        hideDismissButton: false,
                        title: isFunction(options.willReturnAlertTitle) ? options.willReturnAlertTitle(activity) : __("UI_ALERT_" + activity.type.toUpperCase()),
                        content: documentAlertBody || skin.span({
                            innerHTML: activity.description
                        })
                    });
                modal.classList.add('procedure-alert');
                if (documentAlertBody) {
                    modal.classList.add('procedure-document-alert');
                }
                if (activity.type) {
                    modal.classList.add(activity.type.toLowerCase());
                }
                skin.append(modal);
                modal.$el.focus();
                modal.once('closed', function () {
                    component.emit('closed');
                });
            }
        }

        this.on('show', processAlert);
    };
});