/**
 * :issue (!)
 */
define(function (require, exports, module) {
    
    module.exports = function (skin, options, solo) {

        options = options || {};
        var linkSelector = options.linkSelector || '';
        if (!linkSelector)
            return;
        
        var DMC = require('./s1000d-coding').DMC;
        var a_dmRef = skin.element.querySelectorAll(linkSelector);
        
        try {
            if (solo.training && solo.training.sco && !solo.training.sco.isStub()) {
                //run from LMS -> all links disabled
                for (var i = 0; i < a_dmRef.length; i++) {
                    a_dmRef[i].classList.add('disabled');
                }
                return;
            }

            var uriIndex = options.uriIndex;
            if (!uriIndex) {
                //run single application or structure has no index -> do nothing
                return;
            }

            for (var i = 0; i < a_dmRef.length; i++) {
                var dmCode = a_dmRef[i].querySelector('.dmCode');
                var uri = (a_dmRef[i].dataset.dmc) ? (new DMC(a_dmRef[i])).getURI() : (new DMC(dmCode)).getURI();
                var descriptor = uriIndex[uri];
                
                if (descriptor) {
                    //reference exsists in index
                    a_dmRef[i].setAttribute('href', '#');
                    a_dmRef[i].addEventListener('click', (function (descriptor) {
                        return function () {
                            solo.dispatch('doc.openLink', descriptor);
                        }
                    })(descriptor));
                } else if (options.SCORM === '12') {
                    //zip SCORM format publication, link doesn't exsist in index -> disable current link
                    a_dmRef[i].classList.add('disabled');
                } else {
                    //HTML SCORM format publication, structure publication -> open link in new tab
                    a_dmRef[i].setAttribute('target', '_blank');
                } 
            }
        } catch (e) {
            console.log('**** error while remove dmRef: ' + e.description);
        }
    };
});