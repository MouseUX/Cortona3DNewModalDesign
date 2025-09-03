define(function (require, exports, module) {
    function _00(n) {
        n = n || 0;
        return (n < 10) ? '0' + n : n;
    }

    module.exports = function (skin, options, solo) {
        var meta = solo.uniview.metadata;
        return skin.use(require('./lib/catalog-ata2200'), solo.expand({
            model: meta._9F3FAEEAA4954bEE881B2427F946428A,
            figure: _00(meta._0FC9A6FF29C44ac4AF83A6EB44460FAA) + (meta._5A652A33F5C84a1dA84FB9B90F3044D1 || ''),
        }, options));
    };
});