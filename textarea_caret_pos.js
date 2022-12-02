/* jshint browser: true */

// Source: https://github.com/component/textarea-caret-position

var properties = [
    'direction',  // RTL support
    'boxSizing',
    // on Chrome and IE, exclude the scrollbar,
    // so the mirror div wraps exactly as the textarea does
    'width',
    'height',
    'overflowX',
    'overflowY',  // copy the scrollbar for IE

    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',

    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',

    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',

    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',  // might not make a difference, but better be safe

    'letterSpacing',
    'wordSpacing',

    'tabSize',
    'MozTabSize',

    'whiteSpace',
    'wordWrap'
];

var isFirefox = window.mozInnerScreenX != null;

export function initMirrorDiv(element) {
    // The mirror div will replicate the textarea's style
    var div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    var style = div.style;
    // currentStyle for IE < 9
    var computed = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
    div.tcp__computedStyle = computed;

    // // Default textarea styles
    // style.whiteSpace = 'pre-wrap';
    // style.wordWrap = 'break-word';

    // Position off-screen
    style.position = 'absolute';  // required to return coordinates properly
    style.visibility = 'hidden';  // not 'display: none' because we want rendering

    // Transfer the element's properties to the div
    properties.forEach(function (prop) {
        style[prop] = computed[prop];
    });

    if (isFirefox) {
        // Firefox lies about the overflow property for textareas:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=984275
        if (element.scrollHeight > parseInt(computed.height))
            style.overflowY = 'scroll';
    } else {
        // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
        style.overflow = 'hidden';
    }

    return div;
}

export function getCaretCoordinates(element, mirror, position) {
    const computed = mirror.tcp__computedStyle;
    mirror.textContent = element.value.substring(0, position);

    var tail = document.createElement('span');
    tail.textContent = element.value.substring(position) || '.';
    mirror.appendChild(tail);

    var coordinates = {
        top: tail.offsetTop + parseInt(computed['borderTopWidth']),
        left: tail.offsetLeft + parseInt(computed['borderLeftWidth']),
        lineHeight: parseInt(computed.lineHeight)
    };

    mirror.removeChild(tail);

    return coordinates;
}

