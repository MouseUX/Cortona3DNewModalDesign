/**
 */
define(function (require, exports, module) {
    module.exports = function (name) {
        var SVG_HEAD = 'xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 17 17" stroke="currentColor" fill="currentColor"',
            SVG_BEGIN = '<svg ' + SVG_HEAD + '><g transform="matrix(4.01575,0,0,4.01575,-0,17)" stroke-width="0.18">',
            SVG_END = '</g></svg>';
        var assets = {
            tr_down: '<path d="M2.1167,-0.45088 L0.28358,-3.6258 3.9498,-3.6258 Z"/>',
            tr_up: '<path d="M2.1269,-3.8304 L3.96,-0.65542 0.2938,-0.65542 Z"/>',
            tr_left: '<path d="M0.41703,-2.1206 L3.592,-3.9536 3.592,-0.28746 Z"/>',
            tr_right: '<path d="M3.8193,-2.1167 L0.64427,-0.28358 0.64427,-3.9498 Z"/>',
            sq: '<path fill="none" d="M0.75,-3.5 L3.5,-3.5 3.5,-0.75 0.75,-0.75 Z"/>',
            hl: '<path d="M0.5,-2.1083 L3.8097,-2.1083 Z"/>',
            cross: '<path d="M0.75,-3.5 L3.5,-0.75 M3.5,-3.5 L0.75,-0.75"/>',
        };
        for (var key in assets) assets[key] = SVG_BEGIN + assets[key] + SVG_END;
        return assets[name] || '';
    };
});