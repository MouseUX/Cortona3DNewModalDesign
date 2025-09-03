define(function (require, exports, module) {
    module.exports = function (s, n) {
        n = n || 64;
        if (s.length > n) {
            var m = Math.floor((n - 3) / 2);
            return s.substring(0, m) + '...' + s.substring(s.length - m);
        }
        return s;
    };
});