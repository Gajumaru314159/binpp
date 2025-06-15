import { FieldDef, StructDef, EnumDef, FormatDef } from './types';

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
