/**
 
 */
define(function (require, exports, module) {

    require('css!./solo-skin-question-preview.css');
    module.exports = function (skin, options, solo) {

        var selectingElement;

        questionFunctions();

        function questionFunctions() {
            //input buttons
            var inputs = document.querySelectorAll('input[data-correct]');
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                if (input.type == 'radio' || input.type == 'checkbox') {
                    input.checked = true;
                }
                if (input.type == 'text') {
                    input.value = input.getAttribute('data-correct');
                }
            }

            //order items
            var orderItems = document.querySelectorAll('.orderItem');
            for (var i = 0; i < orderItems.length; i++) {
                orderItems[i].addEventListener('click', chooseElement);
            }
            //order header toolbar and buttons
            var headerControls = document.querySelectorAll('.headerControl');
            for (var i = 0; i < headerControls.length; i++) {
                headerControls.item(i).classList.add('skin-toolbar');
                headerControls.item(i).classList.add('main');
            }
            
            var orderControlButtons = document.querySelectorAll('.headerControl input, .headerControl button');
            for (var i = 0; i < orderControlButtons.length; i++) {
                orderControlButtons.item(i).classList.add('skin-control');
            }

            disableAllOrderControls();
        }

        function selectDefaultState() {
            if (selectingElement) {
                selectingElement.classList.remove('select');
                selectingElement = null;
            }

            disableAllOrderControls();
        }

        function disableAllOrderControls() {
            var sequenceButtons = document.querySelectorAll('.control .up, .control .down');
            for (var i = 0; i < sequenceButtons.length; i++) {
                sequenceButtons[i].disabled = true;
            }
        }

        function getSiblings(elem) {
            var res = [];
            while (elem.previousElementSibling) {
                res.push(elem.previousElementSibling);
                elem = elem.previousElementSibling;
            }
            return res;
        }

        function removeAllEventListener(elem) {
            var new_element = elem.cloneNode(true);
            elem.parentElement.replaceChild(new_element, elem);
            elem = null;
            return new_element;
        }

        function highlightAnswer(node, state) {
            while (node && !node.classList.contains('highlightAnswer')) {
                node = node.parentElement;
            }
            if (!node)
                return;
            if (state == 'remove') {
                node.classList.remove('correct');
                node.classList.remove('wrong');
            } else if (state == 'correct') {
                node.classList.add('correct');
            } else if (state == 'wrong') {
                node.classList.add('wrong');
            }
        }

        function replaceElements(node1, node2) {
            if (node1 === node2) {
                //alert('match');
                return;
            }

            var tempNode = document.createElement('div');
            node1.parentElement.replaceChild(tempNode, node1);
            node2.parentElement.replaceChild(node1, node2);
            tempNode.parentElement.replaceChild(node2, tempNode);
            tempNode = null;
        }

        function generateClickEvent(elem) {
            var event;
            try {
                event = new Event('click');
            } catch (e) {
                event = document.createEvent("Event");
                event.initEvent("click", true, true);
            }
            elem.dispatchEvent(event);
        }

        function chooseElement() {

            selectDefaultState();

            selectingElement = this;
            var index = getSiblings(selectingElement).length;

            selectingElement.classList.add('select');
            var question = selectingElement;
            while (!question.classList.contains('assessmentQuestion')) {
                question = question.parentElement;
                if (!question)
                    return;
            }

            var controlContainers = question.querySelectorAll('.control');
            //var controlButtons = controlContainers.item(index).querySelectorAll('input, button');

            var buttonUp = controlContainers.item(index).querySelector('.up');
            var buttonDown = controlContainers.item(index).querySelector('.down');

            buttonUp = removeAllEventListener(buttonUp);
            buttonDown = removeAllEventListener(buttonDown);

            buttonUp.disabled = true;
            buttonDown.disabled = true;

            if (selectingElement.parentElement.previousElementSibling) {
                buttonUp.disabled = false;
                buttonUp.addEventListener('click', function () {
                    var replaceElement = selectingElement.parentElement.previousElementSibling.children.item(index);
                    highlightAnswer(selectingElement, 'remove');
                    highlightAnswer(replaceElement, 'remove');
                    replaceElements(selectingElement, replaceElement);
                    generateClickEvent(selectingElement);
                })
            }

            if (selectingElement.parentElement.nextElementSibling) {
                buttonDown.disabled = false;
                buttonDown.addEventListener('click', function () {
                    var replaceElement = selectingElement.parentElement.nextElementSibling.children.item(index);
                    highlightAnswer(selectingElement, 'remove');
                    highlightAnswer(replaceElement, 'remove');
                    replaceElements(selectingElement, replaceElement);
                    generateClickEvent(selectingElement);
                })
            }
        }
    };
});