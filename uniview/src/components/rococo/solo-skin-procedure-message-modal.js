/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop willSkipAlert {function}
 * @prop willReturnAlertTitle {function}
 * @prop willReturnAlertBody {function}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-message-modal.css');

    var uiModal = require('components/modal');

    function isFunction(f) {
        return typeof f === 'function';
    }

    function getTypeName(id, title) {
        // (type-name}-id-id-id...
        // ...title-title-title-(type-name}(-\d+)?
        var res = /^(.*[^-])-.*-\1(-\d+)?$/.exec(id + '-' + title) || '';
        if (res) {
            res = res[1];
        }
        return res;
    }

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml;

        solo.on('app.procedure.didFireEvent', function (type, id, title, info) {
            if (solo.uniview.settings.DisableAlertMessages) return;

            var eventType = getTypeName(id, title),
                eventInfo = (ixml && ixml.getProcedureItemInfo(id)) || {
                    eventType: eventType,
                    description: info || ' '
                },
                parentInfo = (eventInfo.parent && ixml.getProcedureItemInfo(eventInfo.parent)) || {
                    comment: '',
                    description: ''
                },
                eventComment = eventInfo.description || parentInfo.comment,
                eventDescription = parentInfo.description,
                eventTitle = eventInfo.eventType;

            var type = eventDescription.split(':')[0];
            if (eventDescription && type.indexOf(eventType) < 0) {
                eventTitle = type;
            }

            if (!(isFunction(options.willSkipAlert) ? options.willSkipAlert(eventInfo) : false)) {
                var documentAlertBody = (isFunction(options.willReturnAlertBody) && options.willReturnAlertBody(eventInfo)) || '',
                    modal = skin.create(uiModal, {
                        hideDismissButton: false,
                        title: (isFunction(options.willReturnAlertTitle) && options.willReturnAlertTitle(eventInfo)) || eventTitle,
                        content: documentAlertBody || skin.span({
                            innerHTML: eventComment
                        })
                    });
                modal.classList.add('procedure-alert');
                if (documentAlertBody) {
                    modal.classList.add('procedure-document-alert');
                }
                if (eventInfo.eventType) {
                    modal.classList.add(eventInfo.eventType.replace(/[^0-9A-Z]/g, '_').toLowerCase());
                }
                solo.skin.get('app').append(modal);
                modal.$el.focus();
                if (solo.app.procedure.played) {
                    solo.app.procedure.pause();
                    modal.once('closed', function () {
                        solo.app.procedure.play();
                        solo.dispatch('uniview.didDismissModal');
                    });
                }
            }
        });
    };
});

/**
 * @event Cortona3DSolo~"uniview.didDismissModal"
 */
/**
 * @event Cortona3DSolo~"uniview.settings.changedDisableAlertMessages"
 * @type {boolean}
 */
