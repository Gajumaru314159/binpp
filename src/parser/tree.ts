import { TreeNode } from './types';

let rowCounter = 0;

function treeRows(node: TreeNode, depth = 0): string {
    const indent = depth * 20;
    const id = ++rowCounter;
    const hasChildren = !!(node.children && node.children.length);
    const value = hasChildren
        ? ''
        : node.value !== undefined
            ? Array.isArray(node.value)
                ? '[' + node.value.join(', ') + ']'
                : String(node.value)
            : '';
    const arrow = hasChildren ? `<span class="toggle" data-id="${id}">▾</span>` : '';
    let html = `<tr data-id="${id}" data-depth="${depth}" data-hide-count="0"><td class="name" style="padding-left:${indent}px">${arrow}${node.name}</td>` +
        `<td>${value}</td><td>${node.type}</td></tr>`;
    if (node.children) {
        for (const c of node.children) {
            html += treeRows(c, depth + 1);
        }
    }
    return html;
}

export function treeToHtml(node: TreeNode): string {
    rowCounter = 0;
    const rows = treeRows(node);
    return `<table class="tree-table"><thead><tr><th>Name</th><th>Value</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table>`;
}
