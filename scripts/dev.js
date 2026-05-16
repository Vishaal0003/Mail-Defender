import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const rootDir = process.cwd();
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const backendDir = path.join(rootDir, "backend");
const backendEntry = path.join(backendDir, "server.js");
const frontendDir = path.join(rootDir, "frontend");

const processes = [];

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });

const start = (name, command, args, options = {}) => {
  const child = spawn(command, args, {
    cwd: options.cwd || rootDir,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  processes.push(child);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on("exit", (code) => {
    if (code && !process.exitCode) {
      process.exitCode = code;
      stopAll();
    }
  });

  return child;
};

const stopAll = () => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

if (await isPortAvailable(5000)) {
  start("backend", process.execPath, [backendEntry], { cwd: backendDir });
} else {
  console.log("[backend] Port 5000 is already in use. Reusing the running backend.");
}

start("frontend", process.execPath, [
  viteBin,
  "--host",
  "127.0.0.1",
  "--port",
  "8080",
  "--open",
], { cwd: frontendDir });
