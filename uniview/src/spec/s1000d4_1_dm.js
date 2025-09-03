/**
 * 
 */
define(function (require, exports, module) {
    require('css!../main.css');
    require('css!./s1000d/4_1/prc.css');

    var language = document.querySelector('.doc-container .identAndStatusSection .dmAddress .dmIdent .language');
    
    require('./lib/dm-s1000d')({
        issue: '4.1',
        boardno: 'infoentityident',
        lang: (language && language.dataset.languageisocode) || 'en'
    });

    module.exports = function (skin, options, solo) {
    };
});