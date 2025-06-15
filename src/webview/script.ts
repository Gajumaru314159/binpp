declare const acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();
const rawData = document.body.dataset.base64 || '';
const bytes = Uint8Array.from(atob(rawData), c => c.charCodeAt(0));

const select = document.getElementById('bytesPerLine') as HTMLSelectElement;
const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement | null;
const offsetInput = document.getElementById('offset') as HTMLInputElement;
const arrayLimitInput = document.getElementById('arrayLimit') as HTMLInputElement | null;
const viewContainer = document.getElementById('viewContainer') as HTMLElement;

let currentFocusIndex = -1;
let currentBytesPerLine = parseInt(document.body.dataset.bytesPerLine || '16', 10);
let currentOffset = parseInt(document.body.dataset.offset || '0', 10);
let currentArrayLimit = parseInt(document.body.dataset.arrayLimit || '10000', 10);

function renderView(bytesPerLine: number, offset: number): string {
    const slice = bytes.slice(offset);
    let addr = '';
    let hex = '';
    let ascii = '';
    for (let i = 0; i < slice.length; i += bytesPerLine) {
        const row = slice.slice(i, i + bytesPerLine);
        const address = (offset + i).toString(16).padStart(8, '0');
        addr += '<tr><td>' + address + '</td></tr>';
        hex += '<tr>';
        ascii += '<tr>';
        for (let j = 0; j < row.length; j++) {
            const idx = offset + i + j;
            const b = row[j];
            hex += `<td class="byte" data-index="${idx}" contenteditable="true">${b.toString(16).padStart(2, '0')}</td>`;
            ascii += `<td>${(b >= 32 && b <= 126) ? String.fromCharCode(b) : '.'}</td>`;
        }
        hex += '</tr>';
        ascii += '</tr>';
    }
    return '<table class="address">' + addr + '</table>' +
           '<table class="hex">' + hex + '</table>' +
           '<table class="ascii">' + ascii + '</table>';
}

function updateView(focusIndex = -1): void {
    currentBytesPerLine = parseInt(select.value, 10);
    currentOffset = parseInt(offsetInput.value, 10) || 0;
    viewContainer.style.display = 'flex';
    viewContainer.innerHTML = renderView(currentBytesPerLine, currentOffset);
    if (focusIndex >= 0) {
        const el = viewContainer.querySelector(`td.byte[data-index="${focusIndex}"]`);
        if (el instanceof HTMLElement) {
            el.focus();
        }
    }
}

select.addEventListener('change', () => updateView());
offsetInput.addEventListener('change', () => updateView());
function sendParseRequest(): void {
    if (!formatSelect) {
        return;
    }
    currentArrayLimit = parseInt(arrayLimitInput?.value || '0', 10) || currentArrayLimit;
    vscode.postMessage({ type: 'parse', format: formatSelect.value, limit: currentArrayLimit });
}

formatSelect?.addEventListener('change', sendParseRequest);
arrayLimitInput?.addEventListener('change', sendParseRequest);

window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'treeData') {
        if (msg.html) {
            viewContainer.style.display = 'block';
            viewContainer.innerHTML = msg.html;
        } else {
            updateView();
        }
    }
});

viewContainer.addEventListener('focusin', e => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains('byte')) {
        currentFocusIndex = parseInt(target.getAttribute('data-index') || '0', 10);
        vscode.postMessage({ type: 'cursorMove', index: currentFocusIndex });
    }
});

viewContainer.addEventListener('input', e => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains('byte')) {
        const idx = parseInt(target.getAttribute('data-index') || '0', 10);
        const text = (target.textContent || '').trim();
        if (/^[0-9a-fA-F]{1,2}$/.test(text)) {
            const value = parseInt(text, 16);
            bytes[idx] = value;
            updateView(idx);
        } else {
            updateView(idx);
        }
    }
});

updateView();
