/**
 * A helper component to markup reference commands in the DPL table.
 * @module components/dpl-anchor-commands
 * @requires solo-uniview
 */
define(function (require, exports, module) {
    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {string[]} [options.dplReferenceCommands] An array of command IDs to be treated as reference.
     * @param {string} [options.dplColumnIdNomenclature="NOMENCLATURE"] The ID of the DPL column in which the reference commands will be searched.
     * @param {Cortona3DSolo} solo
     * @returns {UISkinComponent}
     * @fires Cortona3DSolo~"uniview.dpl.didSetupReferenceCommand"
     * @listens Cortona3DSolo~"app.ipc.dpl.didSetupRow"
     * @tutorial component-usage
     * @tutorial component-dpl-anchor-commands
     */
    module.exports = function (skin, options, solo) {
        if (!options.dplReferenceCommands) return;

        var ixml = solo.uniview.ixml,
            refCommandSelector = options.dplReferenceCommands.reduce(function (syntax, cmd) {
                return syntax + (syntax && ',') + '.command[data-type=' + cmd + ']';
            }, '');

        solo.on('app.ipc.dpl.didSetupRow', function (rowElement, index) {
            var nomenclatureIndex = ixml.getDPLColumnIndexById(options.dplColumnIdNomenclature || 'NOMENCLATURE');

            if (nomenclatureIndex < 0) {
                console.error('DPL column with ID "' + options.dplColumnIdNomenclature + '" not found.');
                return;
            };

            var pre = rowElement.cells[nomenclatureIndex].children[0]; // td[4] pre

            Array.prototype.slice.call(pre.querySelectorAll(refCommandSelector)).forEach(function (span) {
                span.innerHTML = '<a>' + span.innerHTML + '</a>';
                Array.prototype.slice.call(span.querySelectorAll('a')).forEach(function (a) {
                    /**
                     * The event is fired for each `a` node in the the element with DPL command markup.
                     * @event Cortona3DSolo~"uniview.dpl.didSetupReferenceCommand"
                     * @type {arguments}
                     * @prop {HTMLAElement} a The HTML `a` node.
                     * @prop {HTMLElement} span The HTML node with DPL command markup.
                     */
                    solo.dispatch('uniview.dpl.didSetupReferenceCommand', a, span);
                });
            });
        });
    };
});