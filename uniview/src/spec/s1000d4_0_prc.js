define(function (require, exports, module) {
    require('css!./s1000d/4_0/prc.css');

    module.exports = function (skin, options, solo) {
        return skin.use(require('./lib/procedure-s1000d'), solo.expand({
            issue: '4.0'
        }, options));
    };
});