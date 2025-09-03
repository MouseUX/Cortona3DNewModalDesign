define(function (require, exports, module) {
    function traverseObjects(handles) {
        return handles.reduce(function (acc, handle) {
            var ch = traverseObjects(Cortona3DSolo.app.getChildObjects(handle));
            return acc.concat(ch.length ? ch : (Cortona3DSolo.app.getObjectTypeName(handle) === 'ObjectVM' ? handle : []));
        }, []);
    }
    module.exports = traverseObjects;
});
