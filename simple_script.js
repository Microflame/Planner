"use strict"

import { initMirrorDiv, getCaretCoordinates } from './textarea_caret_pos.js'

let pendingChangesIndicator = null;
let mainInputField = null;

function getScrollToBottom() {
    return window.innerHeight + window.pageYOffset - document.body.scrollHeight;
}

function isAtBottom() {
    return getScrollToBottom() > 5;
}

function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

function getLastLine(text) {
    const lineStart = getLastLineStartIdx(text);
    return text.substring(lineStart);
}

function getLastLineStartIdx(text) {
    const lineStart = text.lastIndexOf('\n') + 1;
    return lineStart;
}

function getAutocompleteType(line) {
    const prefix2ch = line.substring(0, 2);

    switch (prefix2ch) {
        case '. ': // new
            return { type: 'NEW', content: line.substring(2) };
        case '* ': // solve 
            return { type: 'SOVE', content: line.substring(2) };
        case '+ ': // solved in future
            return { type: 'SOLVED', content: line.substring(2) };
        case '/ ': // cancel 
            return { type: 'CANCEL', content: line.substring(2) };
        case '- ': // cancelled in future
            return { type: 'CENCELLED', content: line.substring(2) };
    }

    return null;
}

class Autocomplete {
    constructor(autocompleteElem) {
        this.autocompleteElem = autocompleteElem;
        this.HL_CLASS_NAME = 'AS_highlight';
        this.listRootElem = null;
        this.suggestionElems = [];
        this.isEnabled = false;

        this.replaceRegionBegin = 0;
        this.replaceRegionEnd = 0;
    }

    get length() {
        return this.suggestionElems.length;
    }

    onEdit(inputField) {
        const acType = getAutocompleteType(inputField.lineBeforeCursor);

        if (acType === null) {
            this.disable();
            return;
        }

        this.inputField = inputField;

        this.replaceRegionBegin = inputField.lineUnderCursorBegin + 2;
        this.replaceRegionEnd = inputField.lineUnderCursorEnd;

        const coords = inputField.getCaretCoordinates();
        this._position(0, coords.top + coords.lineHeight);
        this._enable();
        this._load(acType.type, acType.content);
    }

    disable() {
        this.isEnabled = false;
        this.autocompleteElem.style.visibility = 'hidden';
    }

    getHighlightedElem() {
        return this.suggestionElems[this.selectionIdx];
    }

    selectUp() {
        this.getHighlightedElem().classList.remove(this.HL_CLASS_NAME);
        this.selectionIdx = (this.selectionIdx + this.length - 1) % this.length;
        this.getHighlightedElem().classList.add(this.HL_CLASS_NAME);
    }

    selectDown() {
        this.getHighlightedElem().classList.remove(this.HL_CLASS_NAME);
        this.selectionIdx = (this.selectionIdx + 1) % this.length;
        this.getHighlightedElem().classList.add(this.HL_CLASS_NAME);
    }

    select(elem) {
        const text = elem.textContent;
        this.inputField.inputFieldElem.selectionStart = this.replaceRegionBegin;
        this.inputField.inputFieldElem.selectionEnd = this.replaceRegionEnd;
        this.inputField.focus();
        document.execCommand('insertText', false, text);

        this.disable();
    }

    selectHighlighted() {
        this.select(this.getHighlightedElem());
    }

    _load(type, content) {
        const suggestions = ['Первый вариант', 'Второй', 'И еще третий'];
        this._render(suggestions);
    }

    _render(suggestions) {
        {
            this.selectionIdx = 0;

            if (this.listRootElem !== null) {
                this.autocompleteElem.removeChild(this.listRootElem);
                this.listRootElem = null;
            }

            this.suggestionElems = [];
        }

        this.listRootElem = document.createElement('ul');
        this.autocompleteElem.appendChild(this.listRootElem);

        for (const [i, sug] of suggestions.entries()) {
            let liElem = document.createElement('li');
            liElem.textContent = sug;
            this.suggestionElems.push(liElem);
    
            this.listRootElem.appendChild(liElem);
    
            if (i === 0) {
                liElem.classList.add(this.HL_CLASS_NAME);
            }

            liElem.addEventListener('click', () => this.select(liElem));
            // liElem.addEventListener('click', () => console.log(123));
        }
    }

    _position(left, top) {
        this.autocompleteElem.style.top = top + 'px';
        this.autocompleteElem.style.left = left + 'px';
    }

    _enable() {
        this.isEnabled = true;
        this.autocompleteElem.style.visibility = 'visible';
    }
}

class MainInputField {
    constructor(inputFieldElem, autocomplete) {
        this.inputFieldElem = inputFieldElem;
        this.autocomplete = autocomplete;

        this.HEIGHT_PADDING = 5;

        this.adjustHeight();

        this.inputFieldElem.addEventListener('beforeinput', (ev) => { this._beforeEdit(); });
        this.inputFieldElem.addEventListener('input', (ev) => { this._onEdit(); });

        this.mirrorDiv = initMirrorDiv(this.inputFieldElem);

        inputFieldElem.addEventListener('keydown', (ev) => this._onKeyPress(ev));
        // inputFieldElem.addEventListener('focusout', () => this._onLoseFocus());
        inputFieldElem.addEventListener('click', () => this._onClick());
    }

    adjustHeight() {
        let elem = this.inputFieldElem;
        elem.style.height = "5px";
        elem.style.height = (elem.scrollHeight + this.HEIGHT_PADDING) + "px";
    }

    getCaretCoordinates() {
        return getCaretCoordinates(this.textBeforeCursor, this.textAfterCursor, this.mirrorDiv);
    }

    focus() {
        this.inputFieldElem.focus();
    }

    _onSaved() {
        pendingChangesIndicator.hide();
    }

    _beforeEdit() {
        this.wasAtBottomBeforeEdit = isAtBottom();
        this.scrollHeight = this.inputFieldElem.scrollHeight;
    }

    _onEdit() {
        {
            this.isPointCursor = this.inputFieldElem.selectionStart == this.inputFieldElem.selectionEnd;
            this.cursorPos = this.inputFieldElem.selectionStart;
            this.text = this.inputFieldElem.value;
            this.textBeforeCursor = this.text.substring(0, this.cursorPos);
            this.textAfterCursor = this.text.substring(this.cursorPos);
            this.lineUnderCursorBegin = getLastLineStartIdx(this.textBeforeCursor);
            this.lineUnderCursorEnd = this.text.indexOf('\n', this.cursorPos);
            this.lineBeforeCursor = this.textBeforeCursor.substring(this.lineUnderCursorBegin);
        }

        this.adjustHeight();

        if (this.wasAtBottomBeforeEdit) {
            scrollToBottom();
        }

        this.autocomplete.onEdit(this);

        pendingChangesIndicator.show();
    }

    _onKeyPress(ev) {
        if (this.autocomplete.isEnabled) {
            let needsPreventDefault = true;
            switch (ev.key) {
                case 'ArrowUp':
                    this.autocomplete.selectUp();
                    break;
                case 'ArrowDown':
                    this.autocomplete.selectDown();
                    break;
                case 'Enter':
                    this.autocomplete.selectHighlighted();
                    break;
                case 'Escape':
                    this.autocomplete.disable();
                    break;
                default:
                    needsPreventDefault = false;
            }
    
            if (needsPreventDefault) {
                ev.preventDefault();
            }
        }

        if (ev.key == 'Enter' && ev.ctrlKey) {
            const cursorPos = this.inputFieldElem.selectionStart;
            const nlPos = this.inputFieldElem.value.indexOf('\n', cursorPos);
            this.inputFieldElem.selectionStart = nlPos;
            this.inputFieldElem.selectionEnd = nlPos;
            this.focus();
            document.execCommand('insertText', false, '\n');
        }
    }

    _onLoseFocus() {
        this.autocomplete.disable();
    }

    _onClick() {
        this.autocomplete.disable();
    }
}

class PendingChangesIndicator {
    constructor(elem) {
        this.elem = elem;
        this.fadeClassName = 'fade_anim';
    }

    show() {
        this.elem.classList.remove(this.fadeClassName);
        this.elem.style.opacity = 1;
    }

    hide() {
        this.elem.classList.add(this.fadeClassName);
        this.elem.style.opacity = 0;
    }
}

function onSaveButtonClicked() {
    mainInputField._onSaved();
}

function focusInputFiled(inputFieldElem) {
    inputFieldElem.focus();
    const cursor_pos = inputFieldElem.value.length;
    inputFieldElem.selectionEnd = cursor_pos;
    inputFieldElem.selectionStart = cursor_pos;
}

function setupMainInputField() {
    let autocompleteElem = document.getElementById('autocomplete_suggestions');
    autocompleteElem._CONTROLLER = new Autocomplete(autocompleteElem);

    let inputFieldElem = document.getElementById('input_field');
    mainInputField = new MainInputField(inputFieldElem, autocompleteElem._CONTROLLER);
    inputFieldElem._CONTROLLER = mainInputField;

    // focusInputFiled(inputFieldElem);
}

function KeyPress(e) {
    if ((e.code == 'KeyS' || e.code == '\\') && e.ctrlKey) {
        e.preventDefault();
        mainInputField._onSaved();
    }
}
document.onkeydown = KeyPress;

window.onload = () => {
    pendingChangesIndicator = new PendingChangesIndicator(document.getElementById('pending_chages_indicator'));
    document.getElementById('input_field_submit_btn').addEventListener('click', onSaveButtonClicked);
    setupMainInputField()

    // autocompleteWindow = document.getElementById('autocomplete_suggestions');
    // autocompleteData = new AutocompleteData(autocompleteWindow, text_area);

    // text_area.addEventListener('keydown', (ev) => onKeyPressAtInputField(ev.target, ev));
}
