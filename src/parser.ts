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
    value?: number | number[];
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

    const enumRegex = /enum(?:\s+class)?\s+(\w+)(?:\s*:\s*(\w+))?\s*{[\s\S]*?};/g;
    let m: RegExpExecArray | null;
    while ((m = enumRegex.exec(content)) !== null) {
        const name = m[1];
        const underlying = m[2] || 'int32_t';
        enums[name] = { name, underlying };
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
        const typeName = format.enums[field.type]?.underlying || field.type;
        if (format.structs[typeName]) {
            const children: TreeNode[] = [];
            const ctxValues: Record<string, any>[] = [];
            const start = offset;
            for (let i = 0; i < count; i++) {
                const childCtx: Record<string, any> = {};
                const child = parseStruct(typeName, childCtx);
                child.name = `${field.name}[${i}]`;
                children.push(child);
                ctxValues.push(childCtx);
            }
            const size = offset - start;
            ctx[field.name] = ctxValues.length === 1 ? ctxValues[0] : ctxValues;
            return { name: field.name, type: typeName, offset: start, size, children };
        }

        const bsize = builtinSizes[typeName] ?? 1;
        const values: number[] = [];
        const start = offset;
        for (let i = 0; i < count; i++) {
            let val: number;
            switch (typeName) {
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
        return { name: field.name, type: typeName, offset: start, size: bsize * count, value: count === 1 ? values[0] : values };
    }

    return parseStruct(rootName, {});
}

export function treeToHtml(node: TreeNode): string {
    let html = `<li><span>${node.name} (${node.type})`;
    if (node.value !== undefined) {
        html += ` : ${Array.isArray(node.value) ? '[' + node.value.join(', ') + ']' : node.value}`;
    }
    html += '</span>';
    if (node.children && node.children.length) {
        html += '<ul>' + node.children.map(c => treeToHtml(c)).join('') + '</ul>';
    }
    html += '</li>';
    return html;
}
