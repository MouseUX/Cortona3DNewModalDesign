/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop filter {function}
 * @prop bom {objects}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-tab-bom.css');

    var ensureVisible = require('lib/ensure-visible');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-rwi-tab-bom'] || {},
            items = (options.bom || solo.rwi.bom).map(bomItemContent).filter(exists),
            bool = function (value) {
                return !!value;
            },
            withContent = items.some(function (item) {
                return (typeof item === 'object') ? item.content.some(bool) : false;
            });

        if (!withContent && !options.persistentTab) return {};

        var element = skin.div('.bom');

        function exists(item) {
            return !!item;
        }

        function bomItemContent(item) {
            var node = solo.rwi.interactivity.getPartByDocId(item.id);

            function field(label, text, hideEmpty) {
                return (!text && hideEmpty) ? '' : skin.label('', label, skin.text('', text));
            }

            function makeSnapshot(name) {
                var w = solo.uniview.options.ThumbnailsWidth || 96,
                    h = solo.uniview.options.ThumbnailsHeight || 96,
                    orientation = solo.uniview.options.ThumbnailsFitMode || 0;
                return solo.app.makeSnapshot([name], w, h, orientation, solo.app.SNAPSHOT_UNDO_FIELD_VALUE_CHANGES + solo.app.SNAPSHOT_REVEAL_HIDDEN_OBJECTS);
            }

            if ((typeof options.filter === 'function' && !options.filter(item)) || !node) {
                return '';
            }

            var children = item.children.map(bomItemContent).filter(exists),
                content = [
                    field(i18n.partNumber, node.$text('pnr'), true),
                    field(i18n.description, node.$text('desc'), true),
                    field(i18n.quantity, node.$text('qty'), true),
                    field(i18n.alternate, node.$text('altpnr'), true)
                ].filter(exists),
                info = ixml.getDocItemInfo(item.id),
                isSnapshotEnabled = solo.uniview.options.EnablePartThumbnails && solo.app.makeSnapshot && !children.length && info;

            return {
                id: item.id,
                content: [
                    skin.create('div', content),
                    isSnapshotEnabled ? skin.create('img.thumbnail', { dataset: { id: item.id }, src: makeSnapshot(info.objectNames[0]) }) : ''
                ],
                onmouseover: function (event) {
                    solo.app.procedure.hoverItem(item.id, true);
                },
                onmouseout: function (event) {
                    solo.app.procedure.hoverItem(item.id, false);
                },
                onclick: function (event) {
                    solo.dispatch('uniview.showAllPanels');
                    solo.app.procedure.toggleDrawingDisplayMode(false);
                    solo.dispatch('procedure.selectObjects', item.id);
                },
                children: children
            };
        }

        solo.on('procedure.didObjectEnter', function (docId) {
            var dt = element.querySelector('.content[data-id="' + docId + '"]');
            if (dt) {
                dt.classList.add('hover');
            }
        });

        solo.on('procedure.didObjectClick', function (docId) {
            var dt = element.querySelector('.content[data-id="' + docId + '"]');
            if (dt) {
                ensureVisible(dt);
            }
        });

        solo.on('procedure.didObjectOut', function (docId) {
            var dt = element.querySelector('.content[data-id="' + docId + '"]');
            if (dt) {
                dt.classList.remove('hover');
            }
        });

        element.append(skin.create(require('components/tree'), {
            items: items,
            collapsed: solo.uniview.options.BOMStyle == 1
        }).$el);

        return this.exports(element);
    };
});