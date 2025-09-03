define(function (require, exports, module) {
    var _params = {},
        a = decodeURI(self.location.search).substr(1).split('&');

    a.forEach(function (item) {
        var p = item.split('=');
        _params[p[0]] = (p.length > 1) ? p[1] : p[0];
    });


    module.exports = {
        get: function (name, defaultValue) {
            return (typeof _params[name] !== "undefined") ? _params[name] : defaultValue;
        }
    };
});