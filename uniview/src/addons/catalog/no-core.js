define(function (require, exports, module) {
    var solo = window.Cortona3DSolo;

    if (solo.core) return;

    solo.expand(solo.app, {
        ipc: {
            getCurrentSheet: function () {}
        }
    });

});