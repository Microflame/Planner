"use strict"

let isAtBottom = true;
let mainInputScrollHeight = 0;

window.onload = () => {
    let text_area = document.getElementById("input_field");
    text_area.addEventListener('beforeinput', (ev) => { beforeMainInput(text_area); });
    mainInputScrollHeight = text_area.scrollHeight;
}

function debounce(func, timeout) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    }
}

function maybeResizeHeight(element) {
    // if (element.scrollHeight !== mainInputScrollHeight) {
        element.style.height = "auto";
        element.style.height = (element.scrollHeight + 5) + "px";
    // }
}

function getScrollToBottom() {
    return window.innerHeight + window.pageYOffset - document.body.scrollHeight;
}

function logScrollInfo() {
    console.log(getScrollToBottom());
}

function beforeMainInput(self) {
    let scroll = getScrollToBottom();
    isAtBottom = scroll > 5;
    mainInputScrollHeight = self.scrollHeight;
}

function onMainInput(self) {
    logCursorPositionDebounced();
    maybeResizeHeight(self);
    if (isAtBottom) {
        window.scrollTo(0, document.body.scrollHeight);
    }
}

function logCursorPosition() {
    // let text_area = document.getElementById("input_field");
    // console.log(text_area.selectionStart);
}

let logCursorPositionDebounced = debounce(logCursorPosition, 500)

// window.setInterval(logCursorPosition, 1000);
