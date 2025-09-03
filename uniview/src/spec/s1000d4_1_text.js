/**
 * 
 */
define(function (require, exports, module) {
    require('css!./s1000d/4_1/prc.css');

    module.exports = function (skin, options, solo) {
        var mediaLinkHandlers = skin.create(require('./lib/media-links'));

        options.helpAction = null;
        if (options.handlers) {
            solo.expand(options.handlers, mediaLinkHandlers);
        }

        return skin.use(require('./lib/procedure-s1000d'), solo.expand({
            issue: '4.1',
            handlers: mediaLinkHandlers
        }, options));
    };
});