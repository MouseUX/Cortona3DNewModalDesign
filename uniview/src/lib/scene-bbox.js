define(function (require, exports, module) {
    function sceneBoundBox(solo, children) {
        solo = solo || Cortona3DSolo;
        children = children || solo.app.getChildObjects();

        var Vec3f = solo.app.util.Vec3f,
            zero3f = (new Vec3f()).toArray();

        return children
            .map(ch => solo.app.getObjectBoundingBox(ch, solo.app.OBJECT_BOUNDING_BOX_GLOBAL))
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
    module.exports = sceneBoundBox;
});