#!/usr/bin/env node
// Демо-цикл разработки Atlas: nsh dev-сервер с hot reload + GPUI-хост в демо.
//
//   pnpm demo                 # поднять сервер (если не поднят) и запустить Atlas
//   pnpm demo --restart       # перезапустить уже запущенный nsh dev-сервер
//   pnpm demo --no-server     # не трогать сервер, только приложение
//   pnpm demo --port 8800     # другой порт dev-сервера
//   pnpm demo --release       # release-сборка Atlas
//   pnpm demo --offscreen     # окно вне экрана и без фокуса: агент снимает его,
//                             # а человек продолжает работать за своими окнами
//
// Приложение получает ATLAS_DEMO=1 и ATLAS_NSH_DEV_SERVER: Engine не нужен,
// ничего не сохраняется. ATLAS_ROUTE открывает окно на другой странице
// (например, ATLAS_ROUTE=notes), это удобно для проверки по снимку экрана.
// Выход из Atlas (или Ctrl+C) гасит сервер, если его поднял этот скрипт.
// Аргументов у бинарника `atlas` нет, поэтому все аргументы скрипта — его
// собственные флаги.

import { execFile, spawn } from "node:child_process";
import { mkdirSync, createWriteStream, existsSync } from "node:fs";
import { connect } from "node:net";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const uiDir = join(root, "ui");
const logsDir = join(root, ".dev-logs");
const isWindows = process.platform === "win32";
const usage =
    "использование: pnpm demo [--restart] [--no-server] [--port N] [--release] [--offscreen]";

function parseArgs(argv) {
    const options = { port: 8790, restart: false, server: true, release: false, offscreen: false };
    // pnpm иногда передаёт разделитель `--` как обычный аргумент.
    const args = argv[0] === "--" ? argv.slice(1) : argv;
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--restart") options.restart = true;
        else if (arg === "--no-server") options.server = false;
        else if (arg === "--release") options.release = true;
        else if (arg === "--offscreen") options.offscreen = true;
        else if (arg === "--port") options.port = Number(args[++index]);
        else if (arg.startsWith("--port=")) options.port = Number(arg.slice(7));
        else if (arg === "--help" || arg === "-h") throw new Error(usage);
        else throw new Error(`неизвестный аргумент ${arg}`);
    }
    if (!Number.isInteger(options.port) || options.port <= 0) throw new Error("--port ждёт число");
    return options;
}

function log(message) {
    process.stdout.write(`atlas demo: ${message}\n`);
}

function portOpen(port, timeout = 400) {
    return new Promise((resolve) => {
        const socket = connect({ host: "127.0.0.1", port });
        const done = (open) => {
            socket.removeAllListeners();
            socket.destroy();
            resolve(open);
        };
        socket.setTimeout(timeout, () => done(false));
        socket.once("connect", () => done(true));
        socket.once("error", () => done(false));
    });
}

async function waitForPort(port, milliseconds) {
    const deadline = Date.now() + milliseconds;
    while (Date.now() < deadline) {
        if (await portOpen(port)) return true;
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
}

// Освободить порт перед --restart: нужен только владелец порта, его и гасим.
async function killPortOwner(port) {
    try {
        if (isWindows) {
            const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "TCP"]);
            const pids = new Set();
            for (const line of stdout.split(/\r?\n/)) {
                const fields = line.trim().split(/\s+/);
                if (fields.length >= 5 && fields[3] === "LISTENING" && fields[1].endsWith(`:${port}`)) {
                    pids.add(fields[4]);
                }
            }
            for (const pid of pids) await execFileAsync("taskkill", ["/pid", pid, "/t", "/f"]);
        } else {
            const { stdout } = await execFileAsync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]);
            for (const pid of stdout.split(/\s+/).filter(Boolean)) process.kill(Number(pid), "SIGTERM");
        }
    } catch {
        // Порт уже свободен или владельца не нашли — это не ошибка запуска.
    }
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
        if (!(await portOpen(port))) return true;
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return false;
}

/// The nsh CLI must match the runtime nsh-base the host links: the dev server
/// bundles the app against that version's components, so an older CLI refuses
/// the ones it does not know (`RichEditor`) and its types lie about events.
/// `NSH_BIN` overrides the pair below.
function nshBin() {
    const candidates = [process.env.NSH_BIN, join(homedir(), ".nsh-0.4.0", "bin", "nsh")].filter(Boolean);
    for (const candidate of candidates) {
        if (existsSync(candidate)) return candidate;
    }
    return "nsh";
}

function childEnv() {
    return { ...process.env };
}

async function startDevServer(port) {
    mkdirSync(logsDir, { recursive: true });
    const logPath = join(logsDir, "atlas-nsh-server.log");
    const stream = createWriteStream(logPath, { flags: "a" });
    const nsh = nshBin();
    const child = spawn(nsh, ["dev", "--server-only", "--port", String(port), "."], {
        cwd: uiDir,
        env: childEnv(),
        stdio: ["ignore", "pipe", "pipe"],
        shell: isWindows,
    });
    child.stdout.pipe(stream);
    child.stderr.pipe(stream);
    child.on("exit", (code) => {
        if (code !== null && code !== 0) log(`nsh dev завершился с кодом ${code}, лог: ${logPath}`);
    });
    log(`${nsh} dev запущен (pid ${child.pid}), лог: ${logPath}`);
    if (!(await waitForPort(port, 60_000))) {
        child.kill();
        throw new Error(`nsh dev не открыл порт ${port} за 60 с, смотри ${logPath}`);
    }
    return child;
}

function stopDevServer(child) {
    if (!child || child.exitCode !== null) return;
    log(`останавливаю nsh dev (pid ${child.pid})`);
    if (isWindows) spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    else child.kill("SIGTERM");
}

function runAtlas(options) {
    const env = childEnv();
    env.ATLAS_DEMO = "1";
    // Окно в стороне от рабочего стола: фокус, клавиатура и мышь остаются
    // у человека. Снимок окна при этом настоящий (`screencapture -l`).
    if (options.offscreen) env.ATLAS_OFFSCREEN = "1";
    env.ATLAS_NSH_DEV_SERVER = `ws://127.0.0.1:${options.port}/ws`;
    const args = ["run", "--bin", "atlas"];
    if (options.release) args.push("--release");
    log(`Atlas: ATLAS_DEMO=1 ATLAS_NSH_DEV_SERVER=${env.ATLAS_NSH_DEV_SERVER}${options.offscreen ? " ATLAS_OFFSCREEN=1" : ""}`);
    const startedAt = Date.now();
    const child = spawn("cargo", args, { cwd: root, env, stdio: "inherit", shell: isWindows });
    child.on("exit", (code, signal) => {
        if (code === 0 && Date.now() - startedAt < 3_000) {
            log("Atlas вышел сразу: проверь другой запущенный экземпляр или лог окна");
        }
        log(`Atlas завершился (${code === null ? signal : `код ${code}`})`);
        stopDevServer(server);
        process.exit(code ?? 0);
    });
    return child;
}

let options;
try {
    options = parseArgs(process.argv.slice(2));
} catch (error) {
    log(error.message);
    process.exit(2);
}
let server = null;
process.on("SIGINT", () => {
    stopDevServer(server);
    process.exit(130);
});
process.on("SIGTERM", () => {
    stopDevServer(server);
    process.exit(143);
});

if (options.restart && (await portOpen(options.port))) {
    log(`перезапуск dev-сервера на порту ${options.port}`);
    if (!(await killPortOwner(options.port))) {
        log(`порт ${options.port} всё ещё занят, подними сервер вручную`);
        process.exit(1);
    }
}

if (options.server) {
    if (await portOpen(options.port)) log(`dev-сервер уже слушает ${options.port}, использую его`);
    else {
        try {
            server = await startDevServer(options.port);
        } catch (error) {
            log(`ошибка: ${error.message}`);
            process.exit(1);
        }
    }
} else if (!(await portOpen(options.port))) {
    log(`ошибка: порт ${options.port} закрыт, а --no-server запрещает поднимать сервер`);
    process.exit(1);
}

runAtlas(options);
