/**
 * 
 */
define(function (require, exports, module) {
    require('css!../main.css');
    require('css!./s1000d/2_3/prc.css');

    var language = document.querySelector('.doc-container .idstatus .dmaddres .language');
    
    require('./lib/dm-s1000d')({
        issue: '2.3',
        boardno: 'boardno',
        lang: (language && language.dataset.language) || 'en'
    });

    module.exports = function (skin, options, solo) {
    };
});
