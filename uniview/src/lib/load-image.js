define(function (require, exports, module) {
    var solo = Cortona3DSolo;

    module.exports = function (src) {
        return new Promise(function (resolve, reject) {
            var image = new Image(),
                url = solo.app.util.createResourceURL(src) || solo.app.util.toUrl(src, solo.app.modelInfo.companionUrl);

            image.src = url;
            image.onload = function () {
                resolve(image);
            };
            image.onerror = function (e) {
                reject(new Error(e));
                solo.app.util.revokeResourceURL(url);
            };
        });
    };

});