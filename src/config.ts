import * as fs from 'fs';
import * as path from 'path';

export interface FormatOptions {
    html: string;
    paths: Record<string, string>;
}

export function loadFormatOptions(workspaceFolder: string | undefined, output: { appendLine(msg: string): void }): FormatOptions {
    let html = '';
    const paths: Record<string, string> = {};

    if (!workspaceFolder) {
        return { html, paths };
    }

    const configPath = path.join(workspaceFolder, 'binpp.json');
    if (!fs.existsSync(configPath)) {
        return { html, paths };
    }

    try {
        const configRaw = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configRaw) as { formats?: string[] };
        const dirs = config.formats ?? [];
        const formatFiles: string[] = ['(None)'];
        for (const d of dirs) {
            const absDir = path.isAbsolute(d) ? d : path.join(workspaceFolder, d);
            if (fs.existsSync(absDir) && fs.statSync(absDir).isDirectory()) {
                for (const f of fs.readdirSync(absDir)) {
                    if (f.endsWith('.h')) {
                        formatFiles.push(f);
                        paths[f] = path.join(absDir, f);
                    }
                }
            }
        }
        html = formatFiles.map(f => `<option value="${f}">${f}</option>`).join('');
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[config] ${msg}`);
        if (err instanceof Error && err.stack) {
            output.appendLine(err.stack);
        }
    }

    return { html, paths };
}
