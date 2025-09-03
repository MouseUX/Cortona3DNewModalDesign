/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-settings-panel.css');
    require('css!./solo-skin-section-plane.css');

    function cmp3f(v1, v2) {
        return v1[0] === v2[0] && v1[1] === v2[1] && v1[3] === v2[3];
    }

    function round(n) {
        return Math.round(n * 1000000) / 1000000;
    }

    module.exports = function (skin, options, solo) {
        var Vec3f = solo.app.util.Vec3f,
            Rotation = solo.app.util.Rotation,
            ortX = new Vec3f(1, 0, 0),
            ortY = new Vec3f(0, 1, 0),
            ortZ = new Vec3f(0, 0, 1);

        var m_lastSelectedObjects = [],
            m_lastBBox;

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item'),
            uiPopup = require('components/rococo/solo-skin-popup-with-header');

        var sceneBoundBox = require('lib/scene-bbox');

        var i18n = solo.uniview.i18n['solo-skin-section-panel'] || {};

        var rangeD = skin.create('input', { type: 'range', step: 'any', oninput: distance }),
            rangeX = skin.create('input', { type: 'range', step: 'any', value: 0, min: -Math.PI, max: Math.PI, oninput: rotateX }),
            rangeY = skin.create('input', { type: 'range', step: 'any', value: 0, min: -Math.PI, max: Math.PI, oninput: rotateY });

        var checkboxPermanent = skin.input({ type: 'checkbox' });
        var checkboxX100 = skin.input({ type: 'checkbox', onchange: x100 });

        function SectionPlane() {
            this.handle = null;
        }

        SectionPlane.prototype.create = function () {
            if (this.handle) return Promise.resolve(this.handle);

            var syntax = require('raw!components/rococo/vrml/UniviewSectionPlane.wrl'),
                url = URL.createObjectURL(new Blob([syntax], { type: 'model/vrml' }));

            return solo.app.createObjectsFromURL(url)
                .then(handles => {
                    solo.app.addObjects(handles);
                    this.handle = handles.at(-1);
                    return this.handle;
                });
        }

        SectionPlane.prototype.setScale = function (v) {
            if (!this.handle) return;
            if (typeof v === 'number') {
                v = new Vec3f(v, v, v);
            }
            solo.app.setObjectPropertyf(this.handle, solo.app.PROPERTY_SCALE, false, v.x, v.y, v.z);
        }

        SectionPlane.prototype.setRotation = function (r, animated) {
            if (!this.handle) return;
            this.rotation = r;
            solo.app.setObjectPropertyf(this.handle, solo.app.PROPERTY_ROTATION, animated, r.x, r.y, r.z, r.angle);
        }

        SectionPlane.prototype.setTranslation = function (v, animated) {
            if (!this.handle) return;
            this.translation = v;
            solo.app.setObjectPropertyf(this.handle, solo.app.PROPERTY_TRANSLATION, animated, v.x, v.y, v.z);
        }

        SectionPlane.prototype.setVisibility = function (n) {
            if (!this.handle) return;
            solo.core._tiramisu_setObjectPropertyf(this.handle, solo.app.PROPERTY_VISIBILITY, false, n);
        }

        SectionPlane.prototype.getRotation = function () {
            if (!this.handle) return new Rotation();
            return new Rotation(solo.app.getObjectPropertyf(this.handle, solo.app.PROPERTY_ROTATION));
        }

        SectionPlane.prototype.getTranslation = function () {
            if (!this.handle) return new Vec3f();
            return new Vec3f(solo.app.getObjectPropertyf(this.handle, solo.app.PROPERTY_TRANSLATION));
        }

        var sp = new SectionPlane(),
            center = new Vec3f();

        sp.create();

        var popup = skin.render(uiPopup, {
            title: i18n.captionSectionPlane,
            content: [
                skin.create('.orientation',
                    skin.create('.subheader', i18n.orientation),
                    skin.label(skin.span({}, 'X'), rangeX),
                    skin.label(skin.span({}, 'Y'), rangeY),
                    skin.create('.buttons.panel-settings-item',
                        skin.container(
                            skin.button({ onclick: planeX }, i18n.left),
                            skin.button({ onclick: planeY }, i18n.top),
                            skin.button({ onclick: planeZ }, i18n.front)
                        ),
                        skin.button({ onclick: flip }, i18n.flip),
                    ),
                ),
                skin.create('hr'),
                skin.label(skin.span({}, 'D'), rangeD),
                skin.create('.buttons.right.panel-settings-item',
                    skin.button({ onclick: function () { reset(); } }, i18n.reset)
                ),
                skin.create('hr'),
                skin.label(checkboxX100, skin.span({}, i18n.x10)),
                skin.label(checkboxPermanent, skin.span({}, i18n.permanent))
            ]
        });

        popup.classList.add('section-plane-settings');
        popup.classList.add('panel-settings');

        popup.on('closed', close);

        var sectionButton = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'SectionPlane',
            id: 'btn-section-plane',
            label: i18n.titleSectionPlane,
            onchange: function (value) {
                if (!sp.handle) return;
                if (value) {
                    if (!checkboxPermanent.checked) {
                        reset();
                    }
                    popup.emit('open');
                } else {
                    popup.emit('close');
                }
                sp.setVisibility(value ? 0 : (checkboxPermanent.checked ? 1 : -1));
            }
        });

        var prevD = 0;
        function distance() {
            sp.setTranslation(sp.getTranslation().add(sp.getRotation().multVec(ortZ).multiply(this.value - prevD)));
            prevD = this.value;
        }

        var prevX = 0,
            prevY = 0;
        function rotateX() {
            rotateDelta(new Rotation(-1, 0, 0, this.value - prevX));
            prevX = this.value;
        }
        function rotateY() {
            rotateDelta(new Rotation(0, 1, 0, this.value - prevY));
            prevY = this.value;
        }

        function rotateDelta(delta) {
            sp.setRotation(sp.getRotation().multiply(delta));
        }

        function planeX() {
            setPlane(ortX.multiply(-1));
        }
        function planeY() {
            setPlane(ortY);
        }
        function planeZ() {
            setPlane(ortZ.multiply(-1));
        }

        function setPlane(v) {
            rangeX.value = 0;
            rangeY.value = 0;
            sp.setRotation(new Rotation(ortZ, v), true);
        }

        function flip() {
            rangeX.value = 0;
            rangeY.value = 0;
            sp.setRotation(sp.getRotation().multiply(new Rotation(ortY, Math.PI)), true);
            rangeD.value = -rangeD.value;
            prevD = rangeD.value;
        }

        var m_savedPlaneSize;

        function reset(keepBinding) {
            if (!keepBinding) {
                m_lastSelectedObjects = solo.app.getSelectedObjects();
            }
            var bbox = sceneBoundBox(solo, m_lastSelectedObjects.length ? m_lastSelectedObjects : solo.app.getChildObjects().filter(o => o !== sp.handle));
            if (m_lastBBox && keepBinding && (cmp3f(bbox.size, [0, 0, 0]) || !m_lastSelectedObjects.length)) {
                bbox = m_lastBBox;
            }
            m_lastBBox = bbox;
            var p = new Vec3f(bbox.size).multiply(1.42);
            var l = Math.max(p.x, p.y, p.z);
            m_savedPlaneSize = l;
            rangeD.min = round(-l / 2);
            rangeD.max = round(l / 2);
            sp.setScale(l);
            center = new Vec3f(bbox.center);
            sp.setTranslation(center, !keepBinding);
            var prev = rangeD.value;
            rangeD.value = 0;
            prevD = 0;
            if (keepBinding) {
                rangeD.value = prev;
                distance.call(rangeD);
            }
            x100();
        }

        function close() {
            solo.uniview.settings.SectionPlane = false;
        }

        function clearSection(keepBinding) {
            if (!sp.handle) return;
            if (sp.rotation) sp.setRotation(sp.rotation);
            sp.setVisibility(solo.uniview.settings.SectionPlane ? 0 : (checkboxPermanent.checked ? 1 : -1));
            reset(keepBinding);
        }

        function refresh() {
            if (!sp.handle) return;
            if (sp.rotation) sp.setRotation(sp.rotation);
            sp.setVisibility(solo.uniview.settings.SectionPlane ? 0 : (checkboxPermanent.checked ? 1 : -1));
            sp.setVisibility(solo.uniview.settings.SectionPlane ? 0 : (checkboxPermanent.checked ? 1 : -1));
        }

        solo.on('uniview.clearSection', clearSection);
        solo.on('catalog.sheetChangeCompleted', function () {
            clearSection(true);
        });
        solo.on('uniview.didReset', refresh);
        solo.on('app.didChangeSelectedObjects', refresh);

        function x100() {
            var k = checkboxX100.checked ? 0.1 : 1;
            rangeD.min = round(+rangeD.value - (+rangeD.value + m_savedPlaneSize / 2) * k);
            rangeD.max = round(+rangeD.value + (m_savedPlaneSize / 2 - rangeD.value) * k);
            rangeX.min = round(+rangeX.value - (+rangeX.value + Math.PI / 2) * k);
            rangeX.max = round(+rangeX.value + (Math.PI / 2 - rangeX.value) * k);
            rangeY.min = round(+rangeY.value - (+rangeY.value + Math.PI / 2) * k);
            rangeY.max = round(+rangeY.value + (Math.PI / 2 - rangeY.value) * k);
        }

        return sectionButton;
    };
});