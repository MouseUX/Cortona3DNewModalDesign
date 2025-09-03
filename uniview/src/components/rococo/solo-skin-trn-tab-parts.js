/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-tab-parts.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var ixml = solo.uniview.ixml;

        var element = skin.div('.parts');

        function bomItemContent(node) {
            var def = node.$attr('id'),
                meta = skin.container('.col.meta',
                    node.$('metainfo')
                    .filter(function (metainfo) {
                        return metainfo.$attr('name').charAt(0) !== '$';
                    })
                    .map(function (metainfo) {
                        return skin.text('', metainfo.$attr('name') + ": ", skin.text('.value', metainfo.$text()));
                    })
                ),
                vpData = solo.training.interactivity.getObjectViewpoint(def);

            skin.toggle(meta, false);

            return {
                id: def,
                onmouseover: function () {
                    solo.dispatch('training.didObjectHover', def);
                },
                onmouseout: function () {
                    solo.dispatch('training.didObjectOut', def);
                },
                onclick: function () {
                    solo.dispatch('training.didObjectLocate', def);
                },
                content: [
                    skin.container({
                            className: 'left',
                            title: __("UI_TXT_LOCATE_PART")
                        },
                        skin.input({
                            className: 'part-checkbox',
                            type: 'checkbox',
                            title: __("UI_PART_SELECT_PART"),
                            disabled: true,
                            onclick: function (event) {
                                solo.dispatch('training.didObjectClick', def);
                                event.stopPropagation();
                            }
                        }),
                        skin.container('.col',
                            skin.container('.row', node.$attr('name')),
                            meta
                        )
                    ),
                    skin.container('.right.group', !vpData ? "" : skin.button({
                        title: __("UI_PART_VIEW_TITLE"),
                            onclick: function (event) {
                                solo.training.setViewpointValue(vpData);
                                event.stopPropagation();
                            }
                        }, __("UI_PART_VIEW")),
                        skin.button({
                            title: __("UI_PART_META_TITLE"),
                            disabled: !meta.firstChild,
                            onclick: function (event) {
                                skin.toggle(meta);
                                event.stopPropagation();
                            }
                        }, __("UI_PART_META"))
                    )
                ]
            };
        }

        function getContentElement(id) {
            return element.querySelector('[data-id="' + id + '"]');
        }

        function validateSelectedParts(expected) {
            solo.dispatch('training.clearSelectedParts');
            expected.forEach(function (operation) {
                var activity = operation.activity;
                if (activity && activity._type == 'Activity') {
                    activity.objects.forEach(function (def, index) {
                        var contentElement = getContentElement(def);
                        if (contentElement) {
                            contentElement.querySelector('.part-checkbox').checked = activity.selected[index];
                        }
                    });
                }
            });
        }

        solo.on('training.didChangeExpectedOperations', validateSelectedParts);
        solo.on('training.willChangeActForms', validateSelectedParts);

        solo.on('training.clearSelectedParts', function () {
            Array.prototype.slice.call(element.querySelectorAll('.part-checkbox')).forEach(function (el) {
                el.checked = false;
            });
        });

        solo.on('app.procedure.didChangePlayerState', function () {
            setTimeout(function () {
                solo.training.interactivity.json.$('scenario/objects/object').forEach(function (node) {
                    var id = node.$attr('id'),
                        hidden = solo.app.getObjectVisibility(solo.app.getObjectWithName(id)) > 0;

                    var contentElement = getContentElement(id);

                    if (contentElement) {
                        if (hidden) {
                            contentElement.classList.add('disabled');
                        } else {
                            contentElement.classList.remove('disabled');
                        }
                        contentElement.querySelector('input').disabled = hidden;
                    }

                });
            }, 0);
        });

        solo.on('training.allowObjectInteraction', function (enabled) {
            Array.prototype.slice.call(element.querySelectorAll('.part-checkbox')).forEach(function (el) {
                el.disabled = !enabled;
            });
        });

        solo.on('training.didObjectHover', function (objectName) {
            var contentElement = getContentElement(objectName);
            if (contentElement) {
                contentElement.parentNode.parentNode.classList.add('hover');
            }
        });

        solo.on('training.didObjectOut', function (objectName) {
            var contentElement = getContentElement(objectName);
            if (contentElement) {
                contentElement.parentNode.parentNode.classList.remove('hover');
            }
        });

        element.append(skin.create(require('components/tree'), {
            items: solo.training.interactivity.json.$('scenario/objects/object').map(bomItemContent).sort(function (a, b) {
                if (a.id > b.id) return 1;
                if (a.id < b.id) return -1;
                return 0;
            })
        }).$el);

        // solo.app.getObjectVisibility(handle)

        return this.exports(element);
    };
});