#!/usr/bin/env node
// Снимок окна Atlas без единого клика по рабочему столу человека.
//
//   pnpm shot out.png              # снять окно Atlas
//   pnpm shot out.png --wait 8     # ждать окно до восьми секунд
//   pnpm shot out.png --app atlas  # другое имя процесса
//
// `screencapture -l <id>` рисует само окно, поэтому оно может лежать за
// другими окнами или стоять вне экрана (`pnpm demo --offscreen`): снимок всё
// равно настоящий, а фокус, клавиатура и мышь остаются у человека.
// Хелпер, который ищет номер окна, собирается один раз в `.dev-logs/bin`.

import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "scripts", "window-id.swift");
const binDir = join(root, ".dev-logs", "bin");
const helper = join(binDir, "window-id");

const usage = "использование: pnpm shot <файл.png> [--wait С] [--app ИМЯ]";

function parseArgs(argv) {
    const args = argv[0] === "--" ? argv.slice(1) : argv;
    const options = { file: "", wait: 3, app: "atlas" };
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--wait") options.wait = Number(args[++index]);
        else if (arg === "--app") options.app = args[++index];
        else if (arg === "--help" || arg === "-h") throw new Error(usage);
        else if (!options.file) options.file = arg;
        else throw new Error(`неизвестный аргумент ${arg}`);
    }
    if (!options.file) throw new Error(usage);
    return options;
}

/// Сборка хелпера: swiftc нет — значит и платформы нет, сказать об этом прямо.
function build() {
    if (existsSync(helper)) return;
    mkdirSync(binDir, { recursive: true });
    try {
        execFileSync("swiftc", ["-O", source, "-o", helper], { stdio: "inherit" });
    } catch (error) {
        throw new Error(`swiftc не собрал ${source}: ${error.message}`);
    }
}

async function windowId(app) {
    const { stdout } = await execFileAsync(helper, [app]);
    const id = Number(stdout.trim());
    if (!Number.isInteger(id) || id <= 0) throw new Error(`окно ${app} не найдено`);
    return id;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    build();
    const deadline = Date.now() + options.wait * 1000;
    let id = 0;
    for (;;) {
        try {
            id = await windowId(options.app);
            break;
        } catch (error) {
            if (Date.now() >= deadline) throw error;
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
    }
    const file = resolve(options.file);
    await execFileAsync("screencapture", ["-x", "-o", "-l", String(id), file]);
    process.stdout.write(`${file} (окно ${id})\n`);
}

main().catch((error) => {
    process.stderr.write(`shot: ${error.message}\n`);
    process.exit(1);
});
