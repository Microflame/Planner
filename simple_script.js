"use strict"

import {initMirrorDiv, getCaretCoordinates} from './textarea_caret_pos.js'

function getScrollToBottom() {
    return window.innerHeight + window.pageYOffset - document.body.scrollHeight;
}

function isAtBottom() {
    return getScrollToBottom() > 5;
}

function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

class MainInputField {
    constructor(input_field, autocomplete) {
        this.input_field = input_field;
        this.autocomplete = autocomplete;

        this.HEIGHT_PADDING = 5;
        
        this.adjustHeight();

        this.input_field.addEventListener('beforeinput', (ev) => { this._beforeMainInputFieldEdit(); });        
        this.input_field.addEventListener('input', (ev) => { this._onMainInputFieldEdit(); });

        this.mirror_div = initMirrorDiv(this.input_field);
    }

    adjustHeight() {
        let elem = this.input_field;
        elem.style.height = "5px";
        elem.style.height = (elem.scrollHeight + this.HEIGHT_PADDING) + "px";
        console.log(elem.scrollHeight);
    }

    getCursorPos() {
        return this.input_field.selectionStart;
    }

    _beforeMainInputFieldEdit() {
        this.wasAtBottomBeforeEdit = isAtBottom();
        this.scrollHeight = this.input_field.scrollHeight;
    }

    _onMainInputFieldEdit() {
        this.adjustHeight();

        if (this.wasAtBottomBeforeEdit) {
            scrollToBottom();
        }
    
        // handleAutocomplete(self);

        let coords = getCaretCoordinates(this.input_field, this.mirror_div, this.getCursorPos());
        this.autocomplete.style.left = coords.left + 'px';
        this.autocomplete.style.top = (coords.top + coords.lineHeight) + 'px';
    }
}

function focusInputFiled(input_field) {
    input_field.focus();
    const cursor_pos = input_field.value.length;
    input_field.selectionEnd = cursor_pos;
    input_field.selectionStart = cursor_pos;
}

function setupMainInputField() {
    let input_field = document.getElementById('input_field');
    let autocomplete = document.getElementById('autocomplete_suggestions');
    input_field._CONTROLLER = new MainInputField(input_field, autocomplete);

    // focusInputFiled(input_field);
}

function KeyPress(e) {
    if ((e.code == 'KeyS' || e.code == 'Enter') && e.ctrlKey) {
        e.preventDefault();
        alert('Save!');
    }
}
document.onkeydown = KeyPress;

window.onload = () => {
    setupMainInputField()

    // autocompleteWindow = document.getElementById('autocomplete_suggestions');
    // autocompleteData = new AutocompleteData(autocompleteWindow, text_area);

    // text_area.addEventListener('keydown', (ev) => onKeyPressAtInputField(ev.target, ev));
}
