define(function (require, exports, module) {
    module.exports = function (value) {
        if (typeof value === 'undefined') {
            return [];
        }
        if (typeof value === 'object' && Array.isArray(value)) {
            return value;
        }
        return [value];
    };
});