export interface FieldDef {
    name: string;
    type: string;
    lengthExpr?: string;
    conditionExpr?: string;
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
