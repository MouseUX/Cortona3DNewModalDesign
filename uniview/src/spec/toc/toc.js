/**
 * :title
 * @enter index
 * @out index
 */
define(function (require, exports, module) {
    require('css!./toc.css');

    module.exports = function (skin, options, solo) {
        var component = this,
            ixml = solo.uniview.ixml,
            tocItems = ixml.getSheetInfo(solo.app.ipc.currentSheetInfo.id)
            .items
            .map(ixml.getItemInfo)
            .map(function (itemInfo, index) {
                var href = itemInfo.metadata._B479653540A9423B8170B31E38783811 || void 0;
                return skin.create('span', {
                        dataset: {
                            index: index
                        },
                        onmouseover: function (event) {
                            component.emit('enter', this.dataset.index);
                        },
                        onmouseout: function (event) {
                            component.emit('out', this.dataset.index);
                        },
                    },
                    skin.create('pre', {}, new Array(+itemInfo.metadata.IND).join(' ')),
                    skin.a({
                        href: href
                    }, itemInfo.part.metadata.DFP)
                );
            });
        return this.exports(
            skin.container('.toc',
                skin.ul('.toc-list', tocItems)
            )
        );
    };
});