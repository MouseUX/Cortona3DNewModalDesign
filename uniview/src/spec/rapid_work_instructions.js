define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        return skin.use(require('uniview-procedure-work-instruction'), options);
    };
});