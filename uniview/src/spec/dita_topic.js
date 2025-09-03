/**
 * 
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        options.helpAction = null;
        return skin.use(require('./dita_task'), options);
    };
});