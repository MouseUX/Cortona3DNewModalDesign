define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var iframe = skin.create(require('components/iframe'), options);

        solo.on('uniview.multimedia.load', function (url, options) {
            options = options || {};
            skin.show(iframe.$el);
            var type = options.type,
                method,
                methodOptions = {
                    controls: options.controls,
                    autoplay: options.autoplay
                };

            switch (type) {
                case 'audio':
                    method = 'loadAudio';
                    break;
                case 'video':
                    method = 'loadVideo';
                    break;
                default:
                    method = 'load';
                    methodOptions = {};
            }

            iframe[method](url, methodOptions);
        });

        solo.on('uniview.multimedia.pause', function () {
            var method = iframe.safeProperty('pause');
            if (method) {
                method.call(iframe.window);
            }
        });

        solo.on('uniview.multimedia.play', function () {
            var method = iframe.safeProperty('play');
            if (method) {
                method.call(iframe.window);
            }
        });

        solo.on('uniview.multimedia.toggle', function (visible) {
            if (visible) {
                skin.show(iframe.$el);
                iframe.window.focus();
                if (iframe.safeProperty('autoplay')) {
                    solo.dispatch('uniview.multimedia.play');
                }
            } else {
                solo.dispatch('uniview.multimedia.pause');
                skin.hide(iframe.$el, true);
            }
        });

        skin.hide(iframe.$el, true);

        return iframe;
    };
});