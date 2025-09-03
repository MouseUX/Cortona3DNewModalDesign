/**
 */
define(function (require, exports, module) {

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            m_complete = true,
            m_resumeTask;

        solo.on('procedure.didObjectEnter', function (docId) {
            solo.core.canvas.parentNode.title = ixml.getDocItemInfo(docId).screentip || '';
            solo.app.procedure.hoverItem(docId, true);
        });

        solo.on('procedure.didObjectOut', function (docId) {
            solo.core.canvas.parentNode.title = '';
            solo.app.procedure.hoverItem(docId, false);
        });

        solo.on('rwi.didJobComplete', function () {
            m_complete = true;
        });

        solo.on('rwi.didResetJob', function () {
            m_complete = true;
        });

        solo.on('rwi.didChangeJobMode', function (jobMode) {
            if (jobMode) {
                solo.dispatch('uniview.showAllPanels');
                solo.app.procedure.toggleDrawingDisplayMode(false);
                if (m_complete) {
                    m_complete = false;
                    solo.app.procedure.stop();
                    var firstTask = solo.rwi.interactivity.json.$('rwi/job/task')[0];
                    if (firstTask) {
                        solo.app.procedure.seekToSubstep(firstTask.$attr('id'));
                    }
                } else {
                    // resume job mode
                    if (m_resumeTask) {
                        solo.app.procedure.seekToSubstep(m_resumeTask.$attr('id'));
                    }
                }
                solo.dispatch('uniview.activateRwiTab', 3); // instructions
            } else {
                m_resumeTask = solo.rwi.activeTask;
            }
            solo.uniview.settings.Locked = jobMode;
            if (!jobMode) {
                solo.app.procedure.pause();
            } else if (options.StartAfterNavigate) {
                solo.app.procedure.play();
            }
        });
    };
});