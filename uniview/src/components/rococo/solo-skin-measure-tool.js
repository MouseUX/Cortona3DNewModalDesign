/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop measureScale {number}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-settings-panel.css');
    require('css!./solo-skin-section-plane.css');
    require('css!./solo-skin-measure-tool.css');

    module.exports = function (skin, options, solo) {
        var Vec3f = solo.app.util.Vec3f,
            Rotation = solo.app.util.Rotation,
            Color = solo.app.ui.color,
            zero3f = (new Vec3f()).toArray();

        var ixml = solo.uniview.ixml;

        var i18n = solo.uniview.i18n['solo-skin-measure-tool'] || {};

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item'),
            uiPopup = require('components/rococo/solo-skin-popup-with-header');

        var selectorType = skin.select({ onchange: type }, [
            { description: i18n.typeBetween, value: 0 },
            { description: i18n.typeLeft, value: 4 },
            { description: i18n.typeRight, value: 1 },
            { description: i18n.typeTop, value: 2 },
            { description: i18n.typeBottom, value: 5 },
            { description: i18n.typeFront, value: 6 },
            { description: i18n.typeBack, value: 3 },
        ]);

        var rangeD = skin.create('input', { type: 'range', step: 'any', value: 0.33, min: 0.1, max: 4, oninput: redraw }),
            rangeDLabel = skin.create('label.panel-settings-item', skin.span({}, 'H'), rangeD),
            checkboxPermanent = skin.input({ type: 'checkbox' }),
            selectorUnits = skin.select({ onchange: redraw }, [
                { description: i18n.unit_mm, value: 1000 },
                { description: i18n.unit_cm, value: 100 },
                { description: i18n.unit_m, value: 1 },
                { description: i18n.unit_in, value: 100 / 2.54 },
                { description: i18n.unit_ft, value: 100 / 30.48 }
            ]);

        var measureControl = skin.create('.skin-container.col.measure-control',
            skin.create('.buttons.panel-settings-item', selectorType),
            rangeDLabel,
            skin.create('.panel-settings-item',
                skin.label(skin.span({}, i18n.units), selectorUnits)
            ),
        );

        var measureScale;

        try {
            var metadataMeasureScale = []
                .concat(
                    ixml.json.$('/SimulationInteractivity/SimulationInformation/metadata/value'),
                    ixml.json.$('/ipc/figure/metadata/value')
                )
                .find(value => value.$attr('name').replace(/^$/, '') === 'MeasureScale' && value.$attr('decl-id') !== 'MEASURESCALE');
            measureScale = metadataMeasureScale && metadataMeasureScale.$text();
        } catch (e) { }

        measureScale = +measureScale || +solo.uniview.metadata.MEASURESCALE || +options.measureScale;
        measureScale = Math.max(measureScale, 0) || 1;

        const STATE_IDLE = -1,
            STATE_START = 0,
            STATE_END = 1,
            STATE_COMPLETE = 2;

        var state = STATE_IDLE;
        var isNavigation = false;
        var willStartNavigation = null;

        var sceneBBox = getBBox();

        var startCursor,
            endCursor,
            measure,
            measureHolder = 0;

        var m_colorLine = getColorWithLuminance(0),
            m_colorMiddle = getColorWithLuminance(0.1);

        var syntaxOnTop = require('raw!components/rococo/vrml/OnTop.wrl'),
            url = URL.createObjectURL(new Blob([syntaxOnTop], { type: 'model/vrml' }));

        solo.app.createObjectsFromURL(url)
            .then(handles => {
                solo.app.addObjects(handles);
                measureHolder = handles.at(-1);
                return measureHolder;
            });


        function chooseLineColors(cursor1, cursor2) {
            var backgroundLuminance = getAverageGrayColor(solo.app.getDefaultBackgroundColors()).getLuminance();
            var middleFactor = 0.03;
            if (options.measureLineColor) {
                m_colorLine = Color(options.measureLineColor);
                m_colorMiddle = m_colorLine;

                var middleLuminance = m_colorMiddle.getLuminance(),
                    deltaLuminance = backgroundLuminance - middleLuminance,
                    defaultLuminanceDelta = backgroundLuminance >= 0.5 ? -middleFactor : middleFactor;

                var backgroundHsl = Color(solo.app.getDefaultBackgroundColors()[0]).toHsl(),
                    middleHsl = m_colorMiddle.toHsl();

                var k = Math.abs(Math.abs(middleHsl.h - backgroundHsl.h) % 360 - 180) / 180 * 9 + 1;
                defaultLuminanceDelta *= k;

                if (Math.abs(deltaLuminance) < 0.2) {
                    m_colorMiddle = getColorWithLuminance(backgroundLuminance + defaultLuminanceDelta, middleHsl);
                }
            } else {
                var defaultLuminance = backgroundLuminance >= 0.5 ? 0 : 1,
                    defaultLuminanceDelta = backgroundLuminance >= 0.5 ? middleFactor : -middleFactor;

                m_colorLine = getColorWithLuminance(defaultLuminance);
                m_colorMiddle = getColorWithLuminance(defaultLuminance + defaultLuminanceDelta);
            }
            //console.log(backgroundLuminance, defaultLuminance, m_colorLine + ' ' + m_colorMiddle);
        }

        function getBBox(children) {
            children = children || solo.app.getChildObjects();
            return children.map(solo.app.getObjectBoundingBox)
                .reduce((a, bbox) => {
                    if (!a) {
                        a = bbox;
                    } else if (bbox) {
                        var center = new Vec3f(bbox.center),
                            size2 = new Vec3f(bbox.size).divide(2);

                        var min = center.subtract(size2),
                            max = center.add(size2);

                        var acenter = new Vec3f(a.center),
                            asize2 = new Vec3f(a.size).divide(2);

                        var amin = acenter.subtract(asize2),
                            amax = acenter.add(asize2);

                        min = new Vec3f(Math.min(min.x, amin.x), Math.min(min.y, amin.y), Math.min(min.z, amin.z));
                        max = new Vec3f(Math.max(max.x, amax.x), Math.max(max.y, amax.y), Math.max(max.z, amax.z));

                        a.size = max.subtract(min).toArray();
                        a.center = max.add(min).divide(2).toArray();
                    }
                    return a;
                }, null) || { center: zero3f, size: zero3f };

        }

        function getColorWithLuminance(lum, baseHsl) {
            lum = Math.max(Math.min(lum, 1), 0);
            var c = baseHsl || { h: 0, s: 0, l: 0 };
            c.l = 50;
            var c1 = 0,
                c2 = 100;
            var delta = Color(c).getLuminance() - lum;
            while (Math.abs(delta) > 0.001 && Math.abs(c1 - c2) > 0.00001) {
                if (delta > 0) {
                    c2 = c.l;
                } else {
                    c1 = c.l;
                }
                c.l = (c1 + c2) / 2;
                delta = Color(c).getLuminance() - lum;
            }
            return Color(c);
        }

        function getAverageGrayColor(a) {
            var l = a.length ? a.reduce(function (a, c) {
                return a + Color(c).getLuminance()
            }, 0) / a.length : 0.5;
            return getColorWithLuminance(l);
        }


        function Cursor() {
            var syntax = 'Transform { children [ ClippingPlaneCanceller {} Shape { geometry Sphere {} appearance Appearance { material Material { diffuseColor 1 0.8 0 transparency 0 } }} ]}';
            this.handle = solo.app.createObjectsFromString(syntax)[0];
            this.position = new Vec3f();
            this.color = getAverageGrayColor(solo.app.getDefaultBackgroundColors());
            solo.app.addObjects(this.handle);
            solo.app.setObjectIgnorableByPicker(this.handle, true);
            solo.app.setObjectVisibility(this.handle, false);
        }
        Cursor.prototype.hide = function () {
            solo.app.setObjectVisibility(this.handle, false);
            return this;
        }
        Cursor.prototype.show = function () {
            solo.app.setObjectVisibility(this.handle, true);
            return this;
        }
        Cursor.prototype.move = function (location, chainInfo) {
            this.position = location;
            this.chainInfo = chainInfo;
            if (chainInfo) {
                this.chainInfo.bbox = this.chainInfo.chain.map(solo.app.getObjectBoundingBox);
                var c = chainInfo.chain.map(h => solo.app.getObjectPropertyf(h, 0)).filter(c => c).at(-1);
                if (c) {
                    this.color = Color(c);
                }
            }
            solo.app.setObjectPropertyf(this.handle, solo.app.PROPERTY_TRANSLATION, false, location.x, location.y, location.z);
            return this;
        }
        Cursor.prototype.resize = function () {
            var camera = { location: [], scalarParam: 0 };
            camera = solo.app.getCameraProperties(camera);
            camera.orthographicCamera = solo.app.isOrthographicCamera;
            var size = camera.orthographicCamera ? 0.0075 * camera.scalarParam : this.position.subtract(new Vec3f(camera.location)).length() / 180;
            solo.app.setObjectPropertyf(this.handle, solo.app.PROPERTY_SCALE, false, size, size, size);
            //console.log('resize', size, camera);
            return this;
        }
        Cursor.prototype.delete = function () {
            solo.app.removeObjects(this.handle);
        }
        Cursor.prototype.setColor = function (color) {
            var c = Color(color).toArray();
            solo.app.setObjectPropertyf(this.handle, solo.app.PROPERTY_DIFFUSE_COLOR, true, c[0], c[1], c[2]);
            return this;
        }

        function Measure(startCursor, endCursor, type) {
            this.type = type || 0;
            this.startCursor = startCursor;
            this.endCursor = endCursor;
            this.handle = null;
        }
        Measure.prototype.hide = function () {
            //solo.app.setObjectVisibility(this.handle, false);
            if (this.handle) {
                solo.app.removeObjects(this.handle, measureHolder);
                this.handle = null;
            }
            return this;
        }
        Measure.prototype.show = function () {
            //solo.app.setObjectVisibility(this.handle, true);
            if (!this.handle) {
                var syntax;

                chooseLineColors(this.startCursor, this.endCursor);

                switch (this.type) {
                    case 0:
                        syntax = getMeasureLinesSyntax3(this.startCursor, this.endCursor);
                        break;
                    case 1:
                        syntax = getMeasureLinesSyntax2(this.startCursor, this.endCursor, 'x');
                        break;
                    case 2:
                        syntax = getMeasureLinesSyntax2(this.startCursor, this.endCursor, 'y');
                        break;
                    case 3:
                        syntax = getMeasureLinesSyntax2(this.startCursor, this.endCursor, 'z');
                        break;
                    case 4:
                        syntax = getMeasureLinesSyntax2(this.startCursor, this.endCursor, '-x');
                        break;
                    case 5:
                        syntax = getMeasureLinesSyntax2(this.startCursor, this.endCursor, '-y');
                        break;
                    case 6:
                        syntax = getMeasureLinesSyntax2(this.startCursor, this.endCursor, '-z');
                        break;
                }
                this.handle = solo.app.createObjectsFromString(syntax)[0];
                solo.app.addObjects(this.handle, measureHolder);
                solo.app.setObjectIgnorableByPicker(this.handle, true);
            }
            return this;
        }
        Measure.prototype.move = function (endCursor) {
            this.endCursor = endCursor;
            this.delete();
            this.show();
            return this;
        }
        Measure.prototype.delete = function () {
            if (this.handle) {
                solo.app.removeObjects(this.handle, measureHolder);
            }
        }

        function getAppearanceSyntax(color) {
            var emissiveColor = Color(color || [0, 0, 0]).toArray();
            return 'Appearance { \
                    material Material { \
                        emissiveColor ' + emissiveColor.join(' ') + ' \
                    } \
                }';
        }

        function toMFString(a) {
            return a.map(item => Array.isArray(item) ? item.join(' ') : item.toString()).join(',');
        }

        function toMFInt32String(a) {
            return a.join(' ');
        }

        function addLine(p1, p2, point, coordIndex, colorIndex) {
            var p = p1.add(p2).divide(2);
            var pi1 = point.indexOf(p1);
            if (pi1 < 0) {
                pi1 = point.length;
                point.push(p1);
            }
            var pi2 = point.indexOf(p2);
            if (pi2 < 0) {
                pi2 = point.length;
                point.push(p2);
            }
            var pi = point.indexOf(p);
            if (pi < 0) {
                pi = point.length;
                point.push(p);
            }
            coordIndex.push(pi1); colorIndex.push(0);
            coordIndex.push(pi); colorIndex.push(1);
            coordIndex.push(pi2); colorIndex.push(0);
            coordIndex.push(-1); colorIndex.push(-1);
        }

        function getLineSyntax(p1, p2, color1, color2) {
            var c1 = Color(color1 || m_colorLine).toArray(),
                c2 = Color(color2 || m_colorMiddle).toArray();

            // p1.add(p2).divide(2)

            var point = [],
                color = [c1, c2],
                coordIndex = [],
                colorIndex = [];

            addLine(p1, p2, point, coordIndex, colorIndex);

            return 'Shape { \
                    geometry IndexedLineSet { \
                        coord Coordinate { \
                            point [' + toMFString(point) + '] \
                        } \
                        color Color	{ color ['+ toMFString(color) + '] } \
                        coordIndex ['+ toMFInt32String(coordIndex) + '] \
                        colorIndex ['+ toMFInt32String(colorIndex) + '] \
                    } \
                }';
        }

        function getPanelTextSyntax(text, offsetLeft, offsetTop, transparency) {
            transparency = typeof transparency !== 'number' ? 0.3 : transparency;
            return 'Panel { \
                    offsetLeft "' + (offsetLeft || 0) + '" \
                    offsetTop "' + (offsetTop || 0) + '" \
                    sticky TRUE \
                    backgroundColor	1 1 1 \
                    backgroundTransparency ' + transparency + ' \
                    borderColor	.8 .8 .8 \
                    borderSize ' + (transparency === 1 ? 0 : 1) + ' \
                    source HTMLText	{ \
                        padding	[6 6 6 6] \
                        body "' + text + '" \
                    } \
                }';
        }

        function getArrowSyntax(p1, p2, axis, color1, color2) {
            var c1 = Color(color1 || m_colorLine).toArray(),
                c2 = Color(color2 || m_colorMiddle).toArray();

            axis = axis || 'y';
            var angle = Math.PI * 15 / 180,
                p = p1.subtract(p2).multiply(.1),
                vert = new Vec3f(),
                axis, p21, p22, p12, p11;

            vert[axis] = 1;

            var axis2 = p.normalize().cross(vert);
            p21 = p2.add((new Rotation(axis2, angle)).multVec(p));
            p22 = p2.add((new Rotation(axis2, -angle)).multVec(p));

            p = p.negate();
            axis2 = p.normalize().cross(vert);
            p11 = p1.add((new Rotation(axis2, angle)).multVec(p));
            p12 = p1.add((new Rotation(axis2, -angle)).multVec(p));

            var point = [],
                color = [c1, c2],
                coordIndex = [],
                colorIndex = [];

            addLine(p1, p2, point, coordIndex, colorIndex);
            addLine(p21, p2, point, coordIndex, colorIndex);
            addLine(p22, p2, point, coordIndex, colorIndex);
            addLine(p11, p1, point, coordIndex, colorIndex);
            addLine(p12, p1, point, coordIndex, colorIndex);

            return 'Shape { \
                geometry IndexedLineSet { \
                    coord Coordinate { \
                        point [' + toMFString(point) + '] \
                    } \
                    color Color	{ color ['+ toMFString(color) + '] } \
                    coordIndex ['+ toMFInt32String(coordIndex) + '] \
                    colorIndex ['+ toMFInt32String(colorIndex) + '] \
                } \
            }';
        }

        function getMeasureLinesSyntax1(cursor1, cursor2, axis, text) {
            axis = axis || 'y';

            var vert = new Vec3f();

            vert[axis] = 1;

            var rootBBox = sceneBBox,
                rootCenter = new Vec3f(rootBBox.center),
                rootSize = new Vec3f(rootBBox.size),
                dot1Center = cursor1.position,
                locationPoint1 = dot1Center.add(vert.multiply(rootCenter[axis] + rootSize[axis] / 2 + 0.5 - dot1Center[axis])),
                dot2Center = cursor2.position,
                locationPoint2 = dot2Center.add(vert.multiply(rootCenter[axis] + rootSize[axis] / 2 + 0.5 - dot2Center[axis])),
                delta = vert.multiply(-0.07);

            if (!text) {
                var d = locationPoint1.subtract(locationPoint2).length();
                text = getMeasureText(d);
            }

            var measurement = 'Group {\
                            children [ ClippingPlaneCanceller {} \
                                ' + getLineSyntax(dot1Center, locationPoint1) + '\
                                ' + getLineSyntax(dot2Center, locationPoint2) + '\
                                ' + getArrowSyntax(locationPoint1.add(delta), locationPoint2.add(delta), axis) + '\
                                Transform { \
                                    translation ' + locationPoint1.subtract(locationPoint2).multiply(0.5).add(locationPoint2) + '\
                                    children ' + getPanelTextSyntax(text, '50%', '75%') + ' \
                                } \
                            ]\
                        }';

            return measurement;
        }

        function getMeasureText(d) {
            // 1000 -> 0
            // 100  -> 1
            // 39 -> 2
            // 3.3 -> 3
            // 1 -> 3
            var p = 3;
            if (selectorUnits.value >= 1000) p = 0;
            else if (selectorUnits.value >= 100) p = 1;
            else if (selectorUnits.value >= 10) p = 2;
            var s = (d * selectorUnits.value * measureScale).toFixed(p);
            return s + ' ' + selectorUnits.options[selectorUnits.selectedIndex].textContent;
        }

        function getMeasureLinesSyntax2(cursor1, cursor2, axis, scale, text) {
            axis = axis || 'z';

            var dir = axis.indexOf('-') === 0 ? -1 : 1;

            if (dir < 0) {
                axis = axis.substring(1);
            }

            var vert = new Vec3f();

            vert[axis] = 1;

            var rootBBox = {
                center: cursor1.position.add(cursor2.position).divide(2).toArray(),
                size: cursor1.position.subtract(cursor2.position).toArray().map(p => Math.abs(p))
            },
                /*
                getBBox([
                    cursor1.chainInfo.chain[cursor1.chainInfo.bbox.findLastIndex(bb => !!bb)],
                    cursor2.chainInfo.chain[cursor2.chainInfo.bbox.findLastIndex(bb => !!bb)]
                ]),
                rootCenter = cursor1.position.add(cursor2.position).divide(2),
                */
                rootCenter = new Vec3f(rootBBox.center),
                rootSize = new Vec3f(rootBBox.size),

                dot1Center = cursor1.position,
                dot2Center = cursor2.position,
                length = dot1Center.subtract(dot2Center).length();

            var hValue = rangeD.value,
                hMax = rangeD.max;

            rangeD.max = Math.max(sceneBBox.size[0], sceneBBox.size[1], sceneBBox.size[2]) * 1.412 / length || 4;
            rangeD.value = hValue * rangeD.max / hMax;

            scale = scale || parseFloat(rangeD.value) || 0.33;

            var distance = length * scale,
                locationPoint1 = dot1Center.add(vert.multiply(rootCenter[axis] + (rootSize[axis] / 2 + distance) * dir - dot1Center[axis])),
                locationPoint2 = dot2Center.add(vert.multiply(rootCenter[axis] + (rootSize[axis] / 2 + distance) * dir - dot2Center[axis])),
                delta = vert.multiply(locationPoint1.subtract(locationPoint2).length() * -0.05 * dir);


            //console.log(cursor1, cursor2, rootBBox, sceneBBox, length);

            if (!text) {
                var d = locationPoint1.subtract(locationPoint2).length();
                text = getMeasureText(d);
            }

            //solo.app.setRotationCenterToPoint(rootCenter.x, rootCenter.y, rootCenter.z);

            var arrowPoint1 = locationPoint1.add(delta),
                arrowPoint2 = locationPoint2.add(delta);

            var measurement = 'ZGroup {\
                        write FALSE \
                        check FALSE \
                        children [ ClippingPlaneCanceller {} \
                                ' + getLineSyntax(dot1Center, locationPoint1) + '\
                                ' + getLineSyntax(dot2Center, locationPoint2) + '\
                                ' + getArrowSyntax(arrowPoint1, arrowPoint2, axis) + '\
                                Transform { \
                                    translation ' + locationPoint1.add(locationPoint2).divide(2).subtract(delta) + '\
                                    children ' + getPanelTextSyntax(text, '50%', '75%') + ' \
                                } \
                            ]\
                        }';

            return measurement;
        }

        function getMeasureLinesSyntax3(cursor1, cursor2, axis, text) {
            if (!text) {
                var d = cursor1.position.subtract(cursor2.position).length();
                text = getMeasureText(d);
            }

            var measurement = 'ZGroup {\
                            write FALSE \
                            check FALSE \
                            children [ ClippingPlaneCanceller{} \
                                ' + getLineSyntax(cursor1.position, cursor2.position) + '\
                                Transform { \
                                    translation ' + cursor1.position.subtract(cursor2.position).multiply(0.5).add(cursor2.position) + '\
                                    children ' + getPanelTextSyntax(text, '50%', '75%') + ' \
                                } \
                            ]\
                        }';

            return measurement;
        }

        function getCameraLocation() {
            var camera = { location: [], scalarParam: 0 };
            camera = solo.app.getCameraProperties(camera);
            return new Vec3f(camera.location);
        }

        solo.on('uniview.didKeyDown', (key, context) => {
            if (context.isCanvasVisible && measure) {
                var changed = false;
                switch (key) {
                    case '0000:48':
                        changed = measure.type !== 0;
                        measure.type = 0;
                        break;
                    case '0000:49':
                        changed = measure.type !== 1;
                        measure.type = 1;
                        break;
                    case '0000:50':
                        changed = measure.type !== 2;
                        measure.type = 2;
                        break;
                    case '0000:51':
                        changed = measure.type !== 3;
                        measure.type = 3;
                        break;
                    case '0000:52':
                        changed = measure.type !== 4;
                        measure.type = 4;
                        break;
                    case '0000:53':
                        changed = measure.type !== 5;
                        measure.type = 5;
                        break;
                    case '0000:54':
                        changed = measure.type !== 6;
                        measure.type = 6;
                        break;
                    case '0000:27': // Esc
                        clear();
                        break;
                }
                if (changed && measure.handle) {
                    measure.hide().show();
                }
            }
        })

        var hoverCursor;

        solo.on('touch.didPointerMove', (x, y, buttons, keys) => {
            clearTimeout(willStartNavigation);
            willStartNavigation = null;
            if (isNavigation && buttons) {
                if (startCursor) startCursor.resize();
                if (endCursor) endCursor.resize();
                return;
            }
            var chainInfo = state !== STATE_IDLE ? solo.app.pickObjectChain(x, y) : null;
            switch (state) {
                case STATE_START:
                    startCursor.hide();
                    if (chainInfo) {
                        startCursor.move(new Vec3f(chainInfo.sceneCoord), chainInfo).resize().show();
                        solo.app.setRotationCenterToPoint(startCursor.position.x, startCursor.position.y, startCursor.position.z);
                    }

                    break;
                case STATE_END:
                    if (!measure) {
                        measure = new Measure(startCursor, endCursor);
                        rangeDLabel.classList.add('disabled');
                    }
                    endCursor.hide();
                    measure.hide();
                    if (chainInfo) {
                        endCursor.move(new Vec3f(chainInfo.sceneCoord), chainInfo).resize().show();
                        measure.move(endCursor).show();
                        solo.app.setRotationCenterToPoint(endCursor.position.x, endCursor.position.y, endCursor.position.z);
                    }
                    startCursor.resize();
                    break;
                case STATE_COMPLETE:
                    if (hoverCursor) {
                        hoverCursor.setColor('#F00');
                        hoverCursor = null;
                    }
                    if (chainInfo) {
                        var picked = chainInfo.chain[0];
                        if (picked === endCursor.handle) {
                            hoverCursor = endCursor;
                        } else if (picked === startCursor.handle) {
                            hoverCursor = startCursor;
                        }
                        if (hoverCursor) {
                            hoverCursor.setColor('#FEA');
                        }
                    }
                    break;
            }
        });

        solo.on('touch.didPointerUp', (x, y, buttons, keys) => {
            if (isNavigation) {
                isNavigation = false;
                return;
            }
            var chainInfo = solo.app.pickObjectChain(x, y);
            switch (state) {
                case STATE_START:
                    if (chainInfo) {
                        startCursor.setColor('#F00');
                        endCursor = new Cursor();
                        state = STATE_END;
                        measureControl.classList.add('disabled');
                        selectorType.value = 0;
                    }
                    break;
                case STATE_END:
                    if (chainInfo) {
                        endCursor.setColor('#F00');
                        state = STATE_COMPLETE;
                        solo.app.setObjectIgnorableByPicker(startCursor.handle, false);
                        solo.app.setObjectIgnorableByPicker(endCursor.handle, false);
                        var center = startCursor.position.add(endCursor.position).divide(2);
                        solo.app.setRotationCenterToPoint(center.x, center.y, center.z);
                        solo.app.centerRotationCenterInView(true);
                        measureControl.classList.remove('disabled');
                    }
                    break;
                case STATE_COMPLETE:
                    if (chainInfo) {
                        var picked = chainInfo.chain[0];
                        if (picked === endCursor.handle || picked === startCursor.handle) {
                            state = STATE_END;
                            solo.app.setObjectIgnorableByPicker(startCursor.handle, true);
                            solo.app.setObjectIgnorableByPicker(endCursor.handle, true);
                            var type = 0;
                            if (measure) {
                                type = measure.type;
                                measure.delete();
                                measure = null;
                            }
                            if (picked === startCursor.handle) {
                                var c = endCursor;
                                endCursor = startCursor;
                                startCursor = c;
                            }
                            endCursor.setColor('#FA0');
                            hoverCursor = null;
                            measure = new Measure(startCursor, endCursor, type);
                            if (type) {
                                rangeDLabel.classList.remove('disabled');
                            } else {
                                rangeDLabel.classList.add('disabled');
                            }
                            measure.show();
                            break;
                        }
                    }
                    break;
                    startCursor.setColor('#F00');
                    startCursor.hide();
                    endCursor.delete();
                    endCursor = null;
                    if (measure) {
                        measure.delete();
                        measure = null;
                    }
                    state = STATE_START;
                    break;
            }
        });

        solo.on('app.willStartNavigateInScene', () => {
            setTimeout(() => {
                if (startCursor) startCursor.resize();
                if (endCursor) endCursor.resize();
            }, 10);
            isNavigation = true;
            willStartNavigation = setTimeout(() => {
                isNavigation = false;
            }, 100);

        });

        var popup = skin.render(uiPopup, {
            title: i18n.captionMeasureTool,
            content: [
                measureControl,
                skin.create('.buttons.panel-settings-item',
                    skin.label(checkboxPermanent, skin.span({}, i18n.permanent)),
                    skin.container(
                        skin.button({ onclick: clear }, i18n.clear)
                    )
                )
            ]
        });

        popup.on('closed', close);

        popup.classList.add('measure-tool-settings');
        popup.classList.add('panel-settings');

        function type() {
            if (!measure || !measure.handle) return;
            measure.type = +this.value;
            if (!measure.type) {
                rangeD.value = 0.33;
                rangeDLabel.classList.add('disabled');
            } else {
                rangeDLabel.classList.remove('disabled');
            }
            measure.hide().show();
        }

        function clear() {
            if (startCursor) {
                startCursor.delete();
                startCursor = new Cursor();
            }
            if (endCursor) {
                endCursor.delete();
                endCursor = null;
            }
            if (measure) {
                measure.delete();
                measure = null;
            }
            state = STATE_START;
            measureControl.classList.add('disabled');
            selectorType.value = 0;
        }

        function clearMeasure() {
            clear();
            if (!solo.uniview.settings.MeasureTool) {
                startCursor = null;
                state = STATE_IDLE;
            }
        }

        function close() {
            solo.uniview.settings.MeasureTool = false;
        }

        function redraw() {
            if (!measure || !measure.handle) return;
            measure.hide().show();
        }

        var measureButton = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'MeasureTool',
            id: 'btn-measure-tool',
            label: i18n.titleMeasureTool,
            onchange: function (value) {
                solo.touch.options.disableObjectEvents = value;
                if (value) {
                    if (state === STATE_IDLE) {
                        startCursor = new Cursor();
                        state = STATE_START;
                        measureControl.classList.add('disabled');
                        selectorType.value = 0;
                    } else if (state === STATE_COMPLETE) {
                        startCursor.show();
                        endCursor.show();
                        measureControl.classList.remove('disabled');
                    }
                    popup.emit('open');
                    solo.dispatch('uniview.didCreateInputElement');
                } else {
                    if (checkboxPermanent.checked && state === STATE_COMPLETE) {
                        startCursor.hide();
                        endCursor.hide();
                    } else {
                        clear();
                        startCursor = null;
                        state = STATE_IDLE;
                    }
                    popup.emit('close');
                }
            }
        });

        solo.on('uniview.clearMeasure', clearMeasure);

        solo.on('app.ipc.didSelectSheet', clearMeasure);
        solo.on('catalog.didChangeTransitionAnimationFraction', clearMeasure);
        solo.on('app.procedure.didChangePlayerState', clearMeasure);

        return measureButton;
    };
});