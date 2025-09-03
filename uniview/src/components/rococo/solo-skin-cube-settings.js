/**
 * @namespace Cortona3DSolo.uniview.options
 */
define(function (require, exports, module) {

    function capital(s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }


    module.exports = function (skin, options, solo) {
        var i18n = solo.expand(
            solo.uniview.i18n['solo-skin-toolbar-scene-navigation'] || {},
            solo.uniview.i18n['navigation-cube'] || {}
        );

        var sFORWARD = i18n.forward || "FORWARD",
            sFRONT = i18n.front || "FRONT",
            sREAR = i18n.rear || "REAR",
            sBACK = i18n.back || "BACK",
            sAFT = i18n.aft || "AFT",
            sLEFT = i18n.left || "LEFT",
            sRIGHT = i18n.right || "RIGHT",
            sTOP = i18n.top || "TOP",
            sBOTTOM = i18n.bottom || "BOTTOM",
            sISOMETRIC = i18n.isometric || "ISOMETRIC",
            sLTF = i18n.LTF || "LTF";

        var cube = solo.app.navigationCube;

        function optionAircraft() {
            if (!cube) return;
            cube.localizedText = [
                sFORWARD, sAFT, sLEFT, sRIGHT, sTOP, sBOTTOM
            ];
            cube.rotationOffset = [0, 1, 0, 0];
            cube.sideOrientations = [
                0, 0, 0, 0, -1, -1
            ];
            cube.buttons = [
                { view: cube.FRONT, title: i18n.titleForward || capital(sFORWARD) },
                { view: cube.BACK, title: i18n.titleAft || capital(sAFT) },
                { view: cube.LEFT, title: i18n.titleLeft || capital(sLEFT) },
                { view: cube.RIGHT, title: i18n.titleRight || capital(sRIGHT) },
                { view: cube.TOP, title: i18n.titleTop || capital(sTOP) },
                { view: cube.BOTTOM, title: i18n.titleBottom || capital(sBOTTOM) },
                { view: cube.LEFT | cube.TOP | cube.FRONT, title: i18n.titleLTF || sLTF }
            ];
        }

        function optionMultiviewProjection() {
            if (!cube) return;
            cube.localizedText = [
                sREAR, sFRONT, sLEFT, sRIGHT, sTOP, sBOTTOM
            ];
            cube.rotationOffset = [0, 1, 0, Math.PI];
            cube.sideOrientations = [
                0, 0, 0, 0, 0, 2
            ];
            cube.buttons = [
                { view: cube.BACK, title: i18n.titleFront || capital(sFRONT) },
                { view: cube.FRONT, title: i18n.titleRear || capital(sREAR) },
                { view: cube.RIGHT, title: i18n.titleRight || capital(sRIGHT) },
                { view: cube.LEFT, title: i18n.titleLeft || capital(sLEFT) },
                { view: cube.TOP, title: i18n.titleTop || capital(sTOP) },
                { view: cube.BOTTOM, title: i18n.titleBottom || capital(sBOTTOM) },
                { view: cube.RIGHT | cube.TOP | cube.BACK, title: i18n.titleIsometric || capital(sISOMETRIC) }
            ];
        }

        function optionDefault() {
            if (!cube) return;
            cube.localizedText = [
                sFRONT, sBACK, sLEFT, sRIGHT, sTOP, sBOTTOM
            ];
            cube.rotationOffset = [0, 1, 0, 0];
            cube.sideOrientations = [
                0, 0, 0, 0, 2, 0
            ];
            cube.buttons = [
                { view: cube.FRONT, title: i18n.titleFront || capital(sFRONT) },
                { view: cube.BACK, title: i18n.titleBack || capital(sBACK) },
                { view: cube.LEFT, title: i18n.titleLeft || capital(sLEFT) },
                { view: cube.RIGHT, title: i18n.titleRight || capital(sRIGHT) },
                { view: cube.TOP, title: i18n.titleTop || capital(sTOP) },
                { view: cube.BOTTOM, title: i18n.titleBottom || capital(sBOTTOM) },
                { view: cube.LEFT | cube.TOP | cube.FRONT, title: i18n.titleIsometric || capital(sISOMETRIC) }
            ];
        }

        return {
            i18n: i18n,
            optionAircraft: optionAircraft,
            optionMultiviewProjection: optionMultiviewProjection,
            optionDefault: optionDefault,
            sFORWARD: sFORWARD,
            sFRONT: sFRONT,
            sREAR: sREAR,
            sBACK: sBACK,
            sAFT: sAFT,
            sLEFT: sLEFT,
            sRIGHT: sRIGHT,
            sTOP: sTOP,
            sBOTTOM: sBOTTOM,
            sISOMETRIC: sISOMETRIC,
            sLTF: sLTF
        };
    };
});
