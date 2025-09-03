/**
 * :useUIPublishOptions
 * :TableBackgroundColor
 * :TableColor
 * :TableHeaderBackgroundColor
 * :TableHeaderColor
 * :TableSelectedBackgroundColor
 * :TableSelectedColor
 * :SelectedFrameColor
 * :ShowSpeedSelection
 * :ShowFreezeCheckbox
 * :ShowAutostopBox
 * :ShowMessagesBox
 * :AutoNumbering
 * :TableFontSize
 * :EnableAutostop
 * :EnableWarnings
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var uniview = solo.uniview || {},
            pub = uniview.options || {},
            fontSize = 1;

        if (options.useUIPublishOptions || !uniview.config.skipUIPublishOptions) {

            skin.create(require('./apply-pub-options-toolbar'));

            var tableBack = skin.color(pub.TableBackgroundColor || '#FFF'),
                tableText = skin.color(pub.TableColor || '#000'),
                contentBack = skin.color(pub.ContentBackgroundColor || tableBack || '#FFF'),
                contentText = skin.color(pub.ContentTextColor || tableText || '#000'),
                tableHeaderBack = skin.color(pub.TableHeaderBackgroundColor || '#FFF'),
                tableHeaderText = skin.color(pub.TableHeaderColor || '#000'),
                tableSelectedBack = skin.color(pub.TableSelectedBackgroundColor || pub.HighlightedStepColor || '#EE8'),
                tableSelectedText = skin.color(pub.TableSelectedColor || '#000'),
                tableContextBack = skin.color(pub.SelectedFrameColor || tableSelectedBack.darken(30));

            var css = {
                '.solo-uniview-content': {
                    backgroundColor: contentBack,
                    color: contentText
                },
                '.tiramisu-procedure': {
                    backgroundColor: tableBack,
                    color: tableText
                },
                '.tiramisu-proc-title': {
                    backgroundColor: tableHeaderBack,
                    color: tableHeaderText
                },
                '.tiramisu-proc-item.active': {
                    color: tableSelectedText
                },
                '.tiramisu-proc-item:hover': {
                    backgroundColor: tableSelectedBack.lighten(7),
                    borderColor: tableSelectedBack.darken(30),
                    color: tableSelectedText
                },
                '.doc-container .active': {
                    backgroundColor: tableSelectedBack
                },
                '.doc-container .play-context:after': {
                    backgroundColor: tableContextBack
                },
                '.procedure-seek-selection': {
                    backgroundColor: tableContextBack
                },
                '.panel-comment': {
                    color: tableSelectedText,
                    backgroundColor: tableSelectedBack.darken(1).toRgbString().replace('rgb', 'rgba').replace(')', ', 0.9)')
                }
            };

            if (pub.AutoNumbering === false) {
                css['.tiramisu-proc-item-number'] = {
                    display: 'none'
                };
            }

            switch (pub.TableFontSize) {
                case 'Largest':
                    fontSize = 1.1;
                    break;
                case 'Larger':
                    fontSize = 1.05;
                    break;
                case 'Medium':
                    fontSize = 1;
                    break;
                case 'Smaller':
                    fontSize = 0.95;
                    break;
                case 'Smallest':
                    fontSize = 0.9;
                    break;
            }
            css['.tiramisu-procedure'].fontSize = fontSize + 'em';

            skin.css(css).render();
        }

        solo.uniview.settings.Locked = (pub.EnableAutostop === true);
        solo.uniview.settings.DisableAlertMessages = (pub.EnableWarnings === false);

        if (solo.uniview.options.AutoRepeat) {
            solo.on('app.procedure.didStop', function () {
                var delta = Math.abs(solo.app.procedure.getPlayableRangeStopTime() - solo.app.procedure.position);
                // is forward disabled or end of range
                if (!(solo.app.procedure.state & 0x100) || delta < 0.0001) {
                    solo.app.procedure.stop();
                    solo.app.procedure.play();
                }
            });
        }

        setTimeout(function () {
            if (solo.uniview.options.StartAfterLoading || solo.uniview.doc.autoStartPlayback) {
                solo.app.procedure.play();
            }
        }, 500);
    };
});