
/**
 * 
 */
define(function (require, exports, module) {
    require('css!../../main.css');
    require('css!./dm-s1000d.css');

    module.exports = function (options) {
        options = options || {};
        options.boardno = options.boardno || 'boardno';

        var solo = Cortona3DSolo,
            cssName = "s1000d_" + options.issue.replace(/\./g, '_') + ".css";

        if (!solo.uniview) solo.uniview = {};
        if (!solo.uniview.options) solo.uniview.options = {};

        solo.app.util.requirePromise("css!static/i18n/" + options.lang + "/" + cssName)
            .catch(function () {
                return solo.app.util.requirePromise("css!static/i18n/en/" + cssName);
            });

        Array.prototype.slice.call(document.querySelectorAll('.graphic.link')).forEach(function (graphic) {
            var img = document.createElement('img');
            var svgext = solo.uniview.options.UseCompressedSVG ? '.svgz' : '.svg';
            img.src = graphic.dataset.src.replace(/\.cgm$/i, svgext);
            img.dataset.boardno = graphic.dataset[options.boardno];
            img.alt = graphic.dataset[options.boardno];
            img.classList.add('graphic');
            graphic.parentNode.insertBefore(img, graphic);
            
            var div = document.createElement('div');
            div.classList.add('boardno');
            div.innerText = graphic.dataset[options.boardno];
            graphic.parentNode.insertBefore(div, graphic);
        });
    
        var link = document.querySelector('.link[data-link="toggleStatus"]');
        if (link) {
            link.onclick = function () {
                var n = this.getElementsByClassName('dmStatus');
                if (n.length) {
                    n[0].style.display = (n[0].style.display !== 'block') ? 'block' : 'none';
                }
            };
        }
    };
});