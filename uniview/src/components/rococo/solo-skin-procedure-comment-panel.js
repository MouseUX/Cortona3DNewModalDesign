/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop skipTitle {boolean} Do not display the title in the comment panel
 * @prop actionOnly {boolean} Display information only about the current action
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-comment-panel.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml;

        var element = skin.create('.skin-container.col.panel-comment');

        skin.toggle(element, false);

        if (ixml) {
            solo.on('app.procedure.didEnterSubstepWithName', function (substepid) {
                var comments = [];
                var current = ixml.getProcedureItemInfo(substepid);
                while (current) {
                    if (current.comment && (!options.skipTitle || current.parent)) {
                        comments.push(current.comment);
                    }
                    current = ixml.getProcedureItemInfo(current.parent);
                }
                if (options.actionOnly) {
                    comments = comments.slice(0, 1);
                }
                element.innerHTML = comments.reverse().join('');
            });

            solo.on('uniview.settings.changedComment', function (flag) {
                skin.toggle(element, flag);
            });

        }

        return this.exports(element);
    }
});

/**
 * @event Cortona3DSolo~"uniview.settings.changedComment"
 * @type {boolean}
 */
