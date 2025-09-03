define(function (require, exports, module) {
    var meta = Cortona3DSolo.uniview.metadata;
    if (!meta.APPLIC_DESCR && meta.APPLIC) {
        var parser = new DOMParser(),
            dom = parser.parseFromString(meta.APPLIC, "application/xml"),
            root = Cortona3DSolo.app.util.xmlToJSON(dom);

        var applic = root.$('applic')[0];
        if (applic) {
            meta.APPLIC_DESCR = (typeof applic.displayText === 'string') ? applic.displayText : applic.$('displayText/simplePara').map(n => n.$text()).join(' ');
        }
    }
});