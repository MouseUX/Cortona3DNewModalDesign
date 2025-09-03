/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop {boolean} disableSeekControl Disables the display of the seek control
 * @prop {boolean} disableDurationView Disables the display of the duration in the seek control
 * @prop {boolean} expandToPlayRange 
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-seek.css');

    module.exports = function (skin, options, solo) {
        var procedure = solo.app.procedure,
            i18n = solo.uniview.i18n['solo-skin-procedure-seek'] || {};

        // 0:00
        function formatTime(sec) {
            var d = new Date(0, 0);
            d.setSeconds(sec);
            return d.getMinutes() + ':' + _00(d.getSeconds());
        }

        // 1 -> 01
        function _00(n) {
            n = n || 0;
            return n < 10 ? '0' + n : n;
        }

        var rangeSeek = skin.input({
            type: 'range',
            min: 0,
            max: procedure.duration,
            step: 'any',
            value: 0,
            onchange: function () {
                procedure.setPlayPosition(this.value, true);
                textPos.textContent = formatTime(this.value - this.min);
            }
        });
        rangeSeek.oninput = rangeSeek.onchange;

        var rangeSelection = skin.div('.procedure-seek-selection');
        skin.toggle(rangeSelection, procedure.locked);

        var textPos = skin.text('', formatTime(0));
        var textDuration = skin.text('', formatTime(procedure.duration));

        var element = skin.div('.procedure-seek-container',
            options.disableDurationView ? '' : skin.container('.procedure-duration',
                textPos, skin.text('.divider', '/'), textDuration
            ),
            options.disableSeekControl ? '' : skin.div('.procedure-seek', rangeSeek, skin.div('.procedure-seek-selection-holder', rangeSelection))
        );

        if (!options.disableDurationView) {
            solo.on('app.procedure.didChangePlayerState', function (pos, state) {
                textPos.textContent = formatTime(pos - rangeSeek.min);
            });
        }

        if (!options.disableSeekControl) {
            solo.on('app.procedure.didChangePlayerState', function (pos, state) {
                rangeSeek.value = pos;
            });
        }

        solo.on('uniview.settings.changedLocked', function (flag) {
            if (options.expandToPlayRange) {
                if (!flag) {
                    rangeSeek.min = 0;
                    rangeSeek.max = procedure.duration;
                    textDuration.textContent = formatTime(procedure.duration);
                }
            } else {
                skin.toggle(rangeSelection, flag);
            }
        });

        solo.on('app.procedure.didChangePlayableRange', function (startTime, stopTime) {
            if (options.expandToPlayRange) {
                rangeSeek.min = startTime;
                rangeSeek.max = stopTime;
                textDuration.textContent = formatTime(stopTime - startTime);
                textPos.textContent = formatTime(solo.app.procedure.position - startTime);
            } else {
                var style = rangeSelection.style;
                style.width = ((stopTime - startTime) * 100 / procedure.duration) + "%";
                style.left = (startTime * 100 / procedure.duration) + "%";
            }
        });

        solo.on('app.procedure.didChangePlayableItemList', function (duration) {
            rangeSeek.min = 0;
            rangeSeek.max = duration;
            textDuration.textContent = formatTime(duration);
        });

        return this.exports(element);
    };
});

/**
 * @event Cortona3DSolo~"uniview.settings.changedLocked"
 * @type {boolean}
 */