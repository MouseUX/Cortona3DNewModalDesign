/**
 * 
 */
define(function (require, exports, module) {
    require('css!./s1000d/2_3/prc.css');

    module.exports = function (skin, options, solo) {
        return skin.use(require('./lib/procedure-s1000d'), solo.expand({
            issue: '2.3'
        }, options));
    };
});