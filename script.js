"use strict"

let isAtBottom = true;
let mainInputScrollHeight = 0;
let autocompleteWindow = null;
let autocompleteData = null;

window.onload = () => {
    let text_area = document.getElementById("input_field");
    text_area.addEventListener('beforeinput', (ev) => { beforeMainInput(text_area); });
    mainInputScrollHeight = text_area.scrollHeight;

    autocompleteWindow = document.getElementById('autocomplete_suggestions');
    autocompleteData = new AutocompleteData(autocompleteWindow, text_area);

    text_area.addEventListener('keydown', (ev) => onKeyPressAtInputField(ev.target, ev));
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

    handleAutocomplete(self)
}

function onKeyPressAtInputField(input_field, ev) {
    // console.log('Key: ' + ev.key + ', code: ' + ev.code);
    if (autocompleteData.is_enabled()) {
        let needs_prevent_default = true;
        switch (ev.key) {
            case 'ArrowUp':
                autocompleteData.up();
                break;
            case 'ArrowDown':
                autocompleteData.down();
                break;
            case 'Enter':
                autocompleteData.select();
                break;
            case 'Escape':
                autocompleteData.disable();
                break;
            default:
                needs_prevent_default = false;
        }

        if (needs_prevent_default) {
            ev.preventDefault();
        }
    }
    // if (key === 'Control') {
    //     console.log(input_field.selectionStart);
    //     handleAutocomplete(input_field);
    // }
}

function getAutocompleteType(line) {
    if (line.length < 5) {
        return null;
    }

    if (line[1] === ' ') {
        switch (line[0]) {
            case '-': return '-';
            case '*': return '*';
            case '@': return '@';
        }
    }

    return null;
}

class AutocompleteData {
    constructor(root_element, target_input) {
        this.HL_CLASS_NAME = 'AS_highlight';
        this.root_element = root_element;
        this.target_input = target_input;
        this.list_root_element = null;
        this.clean();

        this.target_input.addEventListener('focusout', () => {this.disable();});
    }

    get length() {
        return this.suggestions.length;
    }

    addSuggestion(suggestion_text) {
        let li_elem = document.createElement('li');
        li_elem.textContent = suggestion_text;
        this.suggestions.push(li_elem);

        if (this.suggestions.length - 1 === this.select_idx) {
            li_elem.classList.add(this.HL_CLASS_NAME);
        }

        this.list_root_element.appendChild(li_elem);
    }

    clean() {
        this.suggestions = [];
        this.select_idx = 0;

        if (this.list_root_element !== null) {
            this.root_element.removeChild(this.list_root_element);
        }

        this.list_root_element = document.createElement('ul');
        this.root_element.appendChild(this.list_root_element);
    }

    disable() {
        if (this.suggestions.length === 0) {
            return;
        }
        this.clean();
    }

    select() {
        const infix = this.suggestions[this.select_idx].textContent;
        this.target_input.selectionStart = this.begin;
        this.target_input.selectionEnd = this.end;
        document.execCommand('insertText', false, infix);

        this.clean();
    }

    load(query, text, begin, end) {
        this.clean();
        this.addSuggestion('- First');
        this.addSuggestion('- Second option');
        this.addSuggestion('- Last one');

        this.text = text;
        this.begin = begin;
        this.end = end;
    }

    is_enabled() {
        return this.suggestions.length > 0;
    }

    up() {
        this.suggestions[this.select_idx].classList.remove(this.HL_CLASS_NAME);
        this.select_idx = (this.select_idx + this.length - 1) % this.length;
        this.suggestions[this.select_idx].classList.add(this.HL_CLASS_NAME);
    }

    down() {
        this.suggestions[this.select_idx].classList.remove(this.HL_CLASS_NAME);
        this.select_idx = (this.select_idx + 1) % this.length;
        this.suggestions[this.select_idx].classList.add(this.HL_CLASS_NAME);
    }
}

function hideAutocomplete() {
    autocompleteData.disable();
}

function showAutocomplete() {
    // autocompleteData.load();
}

function handleAutocomplete(text_area) {
    const cursor_pos = text_area.selectionStart;
    const all_text = text_area.value;

    let line_start = -1;
    if (cursor_pos > 0)
    {
        line_start = all_text.lastIndexOf('\n', cursor_pos - 1);
    }
    line_start += 1;

    let line_end = all_text.indexOf('\n', cursor_pos);
    line_end = line_end === -1 ? all_text.length : line_end;

    const line = all_text.substr(line_start, line_end - line_start);

    const ac_type = getAutocompleteType(line);
    if (ac_type === null)
    {
        hideAutocomplete();
    }
    else
    {
        autocompleteData.load(line, all_text, line_start, line_end);
    }
}

function logCursorPosition() {
    // let text_area = document.getElementById("input_field");
    // console.log(text_area.selectionStart);
}

function adjustHintMarker() {
    const text_area = document.getElementById("input_field");
    const line_num = text_area.value.substr(0, text_area.selectionStart).split("\n").length;
    const marker = document.getElementById("marker");
    marker.style.setProperty('top', (-5 + line_num * 21) + "px");
}

function onClick() {

}

let logCursorPositionDebounced = debounce(logCursorPosition, 500)
let adjustHintMarkerDebounced = debounce(adjustHintMarker, 0)

// window.setInterval(logCursorPosition, 1000);
