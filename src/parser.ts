export interface FieldDef {
    name: string;
    type: string;
    lengthExpr?: string;
}

export interface StructDef {
    name: string;
    fields: FieldDef[];
}

export interface EnumDef {
    name: string;
    underlying: string;
    entries: Record<number, string>;
}

export interface FormatDef {
    structs: Record<string, StructDef>;
    enums: Record<string, EnumDef>;
}

export interface TreeNode {
    name: string;
    type: string;
    offset: number;
    size: number;
    value?: number | string | (number | string)[];
    children?: TreeNode[];
}

const builtinSizes: Record<string, number> = {
    char: 1,
    int8_t: 1,
    uint8_t: 1,
    int16_t: 2,
    uint16_t: 2,
    int32_t: 4,
    uint32_t: 4,
};

export function parseFormatFile(content: string): FormatDef {
    const structs: Record<string, StructDef> = {};
    const enums: Record<string, EnumDef> = {};

    const enumRegex = /enum(?:\s+class)?\s+(\w+)(?:\s*:\s*(\w+))?\s*{([\s\S]*?)}\s*;/g;
    let m: RegExpExecArray | null;
    while ((m = enumRegex.exec(content)) !== null) {
        const name = m[1];
        const underlying = m[2] || 'int32_t';
        const body = m[3];
        const entries: Record<number, string> = {};
        const itemRegex = /(\w+)(?:\s*=\s*([^,]+))?/g;
        let i: RegExpExecArray | null;
        let value = 0;
        while ((i = itemRegex.exec(body)) !== null) {
            const ename = i[1];
            const valStr = i[2];
            if (valStr) {
                const parsed = parseInt(valStr.trim(), 0);
                if (!isNaN(parsed)) {
                    value = parsed;
                }
            }
            entries[value] = ename;
            value++;
        }
        enums[name] = { name, underlying, entries };
    }

    const structRegex = /struct\s+(\w+)\s*{([\s\S]*?)}\s*;/g;
    while ((m = structRegex.exec(content)) !== null) {
        const name = m[1];
        const body = m[2];
        const fields: FieldDef[] = [];
        const lineRegex = /([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)(\s*\[(.+?)\])?\s*;/g;
        let f: RegExpExecArray | null;
        while ((f = lineRegex.exec(body)) !== null) {
            const type = f[1];
            const fname = f[2];
            const lengthExpr = f[4];
            fields.push({ name: fname, type, lengthExpr });
        }
        structs[name] = { name, fields };
    }

    return { structs, enums };
}

export function parseBinary(bytes: Uint8Array, format: FormatDef, rootName = 'Root'): TreeNode {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    const scopeStack: Record<string, any>[] = [];

    if (!format.structs[rootName]) {
        throw new Error(`Root struct '${rootName}' not found`);
    }

    function evaluate(expr: string, local: Record<string, any>): number {
        const scope = Object.assign({}, ...scopeStack, local);
        try {
            // eslint-disable-next-line no-new-func
            return Function(...Object.keys(scope), `return ${expr};`)(...Object.values(scope));
        } catch {
            return 0;
        }
    }

    function parseStruct(name: string, ctx: Record<string, any>): TreeNode {
        const def = format.structs[name];
        if (!def) {
            throw new Error(`Unknown struct: ${name}`);
        }
        const start = offset;
        const node: TreeNode = { name, type: 'struct', offset: start, size: 0, children: [] };
        scopeStack.push(ctx);
        for (const field of def.fields) {
            const fieldNode = parseField(field, ctx);
            node.children!.push(fieldNode);
        }
        scopeStack.pop();
        node.size = offset - start;
        return node;
    }

    function parseField(field: FieldDef, ctx: Record<string, any>): TreeNode {
        const count = field.lengthExpr ? Math.max(0, evaluate(field.lengthExpr, ctx)) : 1;
        const enumDef = format.enums[field.type];
        const baseType = enumDef?.underlying || field.type;
        if (format.structs[baseType]) {
            const children: TreeNode[] = [];
            const ctxValues: Record<string, any>[] = [];
            const start = offset;
            for (let i = 0; i < count; i++) {
                const childCtx: Record<string, any> = {};
                const child = parseStruct(baseType, childCtx);
                child.name = `${field.name}[${i}]`;
                children.push(child);
                ctxValues.push(childCtx);
            }
            const size = offset - start;
            ctx[field.name] = ctxValues.length === 1 ? ctxValues[0] : ctxValues;
            return { name: field.name, type: field.type, offset: start, size, children };
        }

        const bsize = builtinSizes[baseType] ?? 1;
        const values: number[] = [];
        const start = offset;
        for (let i = 0; i < count; i++) {
            if (offset + bsize > view.byteLength) {
                const name = count === 1 ? field.name : `${field.name}[${i}]`;
                throw new RangeError(`Offset is outside the bounds of the DataView while reading '${name}'`);
            }
            let val: number;
            switch (baseType) {
                case 'int8_t':
                case 'char':
                    val = view.getInt8(offset); break;
                case 'uint8_t':
                    val = view.getUint8(offset); break;
                case 'int16_t':
                    val = view.getInt16(offset, true); break;
                case 'uint16_t':
                    val = view.getUint16(offset, true); break;
                case 'int32_t':
                    val = view.getInt32(offset, true); break;
                default:
                    val = view.getUint32(offset, true); break;
            }
            offset += bsize;
            values.push(val);
        }
        ctx[field.name] = count === 1 ? values[0] : values;
        const displayVals = values.map(v => enumDef ? (enumDef.entries[v] ?? v) : v);
        const display = count === 1 ? displayVals[0] : displayVals;
        return { name: field.name, type: field.type, offset: start, size: bsize * count, value: display };
    }

    return parseStruct(rootName, {});
}

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
