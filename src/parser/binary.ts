import { FieldDef, FormatDef, TreeNode } from './types';

const builtinSizes: Record<string, number> = {
    char: 1,
    int8_t: 1,
    uint8_t: 1,
    int16_t: 2,
    uint16_t: 2,
    int32_t: 4,
    uint32_t: 4,
};

export function parseBinary(
    bytes: Uint8Array,
    format: FormatDef,
    maxArrayLength = 10000,
    rootName = 'Root'
): TreeNode {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    const scopeStack: Record<string, unknown>[] = [];

    if (!format.structs[rootName]) {
        throw new Error(`Root struct '${rootName}' not found`);
    }

    function evaluate(expr: string, local: Record<string, unknown>): number {
        const scope = Object.assign({}, ...scopeStack, local);
        try {
            return Function(...Object.keys(scope), `return ${expr};`)(...Object.values(scope));
        } catch {
            return 0;
        }
    }

    function parseStruct(name: string, ctx: Record<string, unknown>): TreeNode {
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

    function parseField(field: FieldDef, ctx: Record<string, unknown>): TreeNode {
        const count = field.lengthExpr ? Math.max(0, evaluate(field.lengthExpr, ctx)) : 1;
        if (count > maxArrayLength) {
            throw new Error(`Array '${field.name}' length ${count} exceeds limit ${maxArrayLength}`);
        }
        const enumDef = format.enums[field.type];
        const baseType = enumDef?.underlying || field.type;
        if (format.structs[baseType]) {
            const children: TreeNode[] = [];
            const ctxValues: Record<string, unknown>[] = [];
            const start = offset;
            for (let i = 0; i < count; i++) {
                const childCtx: Record<string, unknown> = {};
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
        let display: number | string | (number | string)[];
        let typeStr = field.type;
        if (baseType === 'char' && count > 1) {
            display = String.fromCharCode(...values);
            typeStr = 'char[]';
        } else {
            const displayVals = values.map(v => enumDef ? (enumDef.entries[v] ?? v) : v);
            display = count === 1 ? displayVals[0] : displayVals;
        }
        return { name: field.name, type: typeStr, offset: start, size: bsize * count, value: display };
    }

    return parseStruct(rootName, {});
}
