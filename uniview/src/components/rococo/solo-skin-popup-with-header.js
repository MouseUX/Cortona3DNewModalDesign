define(function (require, exports, module) {
    require('css!./solo-skin-popup-with-header.css');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['ui'] || {};

        var svgAssets = skin.create(require('./solo-skin-svg-assets'));

        var uiPopup = require('components/popup');

        var collapseButton = options.disableCollapseButton ? '' : skin.buttonImg({
            classList: 'button-collapse',
            title: i18n.collapse,
            onclick: function () {
                popup.classList.toggle('collapsed');
                this.title = popup.classList.contains('collapsed') ? i18n.expand : i18n.collapse;
            }
        }, skin.html(svgAssets.hl), skin.html(svgAssets.sq));

        var closeButton = options.disableCloseButton ? '' : skin.buttonImg({
            title: i18n.close,
            onclick: function () {
                popup.emit('close');
            }
        }, skin.html(svgAssets.cross));

        var popup = skin.create(uiPopup, {
            content: [
                skin.create('.skin-popup-header', options.title || '', skin.create('.buttons', collapseButton, closeButton)),
                skin.create('.skin-popup-content', options.content)
            ]
        });

        popup.classList.add('skin-popup-with-header');

        return popup;
    };
});