/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-dpl-header.css');
    require('css!./solo-skin-rwi-header.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-rwi-header'] || {};

        var meta = solo.uniview.metadata,
            root = solo.rwi.interactivity.json,
            rwi = root.$('rwi').slice(-1)[0];

        function row(key) {
            return skin.div('',
                skin.label('', i18n[key], skin.text('', rwi.$text(key)))
            );
        }

        var element = skin.container('.skin-rwi-header.direction-column',
            row('jobCode'),
            row('title'),
            row('summary'),
            skin.container('.direction-row',
                skin.container('.direction-column.left',
                    row('workType'),
                    row('expTime'),
                    row('preJob'),
                    row('revision'),
                ),
                skin.container('.direction-column.left',
                    row('role'),
                    row('workCell'),
                    row('postJob'),
                    row('workOrder')
                )
            )
        );

        return this.exports(element);
    };
});