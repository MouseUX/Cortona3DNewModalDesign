define(function (require, exports, module) {
    var escape = document.createElement('textarea');
    module.exports = function (html) {
        escape.textContent = html;
        return escape.innerHTML;
    };
});