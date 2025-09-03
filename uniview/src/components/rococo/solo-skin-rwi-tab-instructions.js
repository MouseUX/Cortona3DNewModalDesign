/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-tab-instructions.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-rwi-tab-instructions'] || {};

        var meta = solo.uniview.metadata,
            root = solo.rwi.interactivity.json,
            rwi = root.$('rwi').slice(-1)[0];

        var element = skin.container('.instructions');

        var processTaskContent = skin.create(require('./solo-skin-rwi-task')).processTaskContent;

        function docTaskContent(task, index) {
            var id = task.$attr('id');
            return {
                id: id,
                content: [
                    !solo.uniview.options.AutoNumbering ? '' : skin.div('.task-number', '' + (index + 1)),
                    skin.div('', (task['@children'] || []).map(processTaskContent))
                ]
            };
        }

        solo.on('rwi.didTaskActive', function (stepId, task) {
            var localBom = task.$('//xref')
                .reduce(function (a, xref) {
                    var xrefid = xref.$attr('xrefid');
                    return (a.indexOf(xrefid) < 0) ? a.concat(xrefid) : a;
                }, [])
                .map(function (xrefid) {
                    return {
                        id: xrefid,
                        type: (solo.rwi.interactivity.getBomItemByDocId(xrefid) || {}).type,
                        children: []
                    };
                }),
                job = skin.div('.job');

            job.append(skin.create(require('components/tree'), {
                items: [docTaskContent(task, rwi.$('job/task').indexOf(task))]
            }).$el);

            skin.clear(element);
            element.append(
                skin.div('.instructions-section',
                    skin.create('h3', {}, i18n.currentTask),
                    job
                ),
                skin.div('.instructions-section',
                    skin.create('h3', {}, i18n.requiredParts),
                    skin.create(require('./solo-skin-rwi-tab-bom'), {
                        bom: localBom,
                        filter: function (item) {
                            return item.type !== 'resource';
                        }
                    }).$el
                ),
                skin.div('.instructions-section',
                    skin.create('h3', {}, i18n.requiredResources),
                    skin.create(require('./solo-skin-rwi-tab-bom'), {
                        bom: localBom,
                        filter: function (item) {
                            return item.type === 'resource';
                        }
                    }).$el
                )
            );
        });

        solo.on('rwi.didJobComplete', function () {
            setTimeout(function () {
                skin.clear(element);
                element.append(
                    skin.div('.instructions-section',
                        skin.create('h3', i18n.jobCompleted)
                    )
                );
            }, 0);
        });

        return this.exports(element);
    };
});