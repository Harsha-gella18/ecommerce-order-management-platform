/**
 * Start all services on localhost. Opens a new terminal window per service on Windows,
 * macOS (Terminal.app), and common Linux terminal emulators.
 *
 * Loads repo-root .env into the process so spawned shells inherit JWT / Mongo vars.
 * Waits for critical ports so the gateway and UI start after dependencies are listening.
 *
 * Prerequisites: MongoDB reachable (local or Atlas via root .env), JDK 11+, Maven, Node, Python 3.
 * Usage: from repo root,  npm start  |  node scripts/run-local.mjs
 */
import { exec, spawn, spawnSync } from 'child_process';
import fs from 'fs';
import net from 'node:net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureEnvFile() {
  const envPath = path.join(root, '.env');
  const examplePath = path.join(root, '.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.warn('Created .env from .env.example — set JWT_SECRET and DB URIs before production.\n');
  } else if (!fs.existsSync(envPath)) {
    console.warn(
      'No .env file found. Copy .env.example to .env in the project root, then restart.\n'
    );
  }
}

/** Merge repo-root .env into process.env so child processes inherit (Spring/Node see the same values). */
function loadRootEnvIntoProcess() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function waitForPort(port, name, timeoutMs = 180000) {
  const host = '127.0.0.1';
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const tryOnce = () => {
      if (Date.now() > deadline) {
        console.warn(
          `[WARN] Timed out waiting for ${name} on ${host}:${port} (${timeoutMs / 1000}s). ` +
            'Open that service window for errors. Is MongoDB running (e.g. localhost:27017)?\n'
        );
        resolve();
        return;
      }
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        console.log(`  ${name} ready (${host}:${port})`);
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        setTimeout(tryOnce, 700);
      });
    };
    tryOnce();
  });
}

/** Maven: -ntp hides download spam; omit -q so each window still shows startup errors. */
const mvnRun = 'mvn -ntp spring-boot:run';

function launchWindows(title, relativeDir, command) {
  const dir = path.join(root, relativeDir);
  const safeTitle = String(title).replace(/"/g, "'");
  const dQuoted = `"${dir.replace(/"/g, '""')}"`;
  const kQuoted = `"${command.replace(/"/g, '""')}"`;
  const line = `start "${safeTitle}" /D ${dQuoted} cmd /k ${kQuoted}`;
  exec(line, { cwd: root, windowsHide: true, env: process.env });
}

function launchMac(relativeDir, command) {
  const dir = path.join(root, relativeDir);
  const script = `cd ${JSON.stringify(dir)} && ${command}`;
  spawn(
    'osascript',
    ['-e', `tell application "Terminal" to do script ${JSON.stringify(script)}`],
    { stdio: 'ignore', detached: true, env: process.env }
  );
}

function hasExecutable(name) {
  return spawnSync('which', [name], { stdio: 'ignore' }).status === 0;
}

function launchLinux(title, relativeDir, command) {
  const dir = path.join(root, relativeDir);
  const sh = `cd ${JSON.stringify(dir)} && ${command}; exec bash`;
  const tries = [
    ['gnome-terminal', ['--title', title, '--', 'bash', '-lc', sh]],
    ['konsole', ['-e', 'bash', '-lc', sh]],
  ];
  for (const [bin, args] of tries) {
    if (!hasExecutable(bin)) continue;
    spawn(bin, args, { stdio: 'ignore', detached: true, env: process.env });
    return;
  }
  console.error(
    `[${title}] No gnome-terminal/konsole found. Run manually: cd ${dir} && ${command}`
  );
}

function launch(title, relativeDir, command) {
  if (process.platform === 'win32') {
    launchWindows(title, relativeDir, command);
  } else if (process.platform === 'darwin') {
    launchMac(relativeDir, command);
  } else {
    launchLinux(title, relativeDir, command);
  }
}

const analyticsCmd =
  process.platform === 'win32'
    ? 'if not exist .venv (python -m venv .venv 2>nul & if not exist .venv py -3 -m venv .venv) & call .venv\\Scripts\\activate.bat & pip install -q -r requirements.txt & uvicorn app.main:app --host 127.0.0.1 --port 8000'
    : '(test -d .venv || python3 -m venv .venv) && . .venv/bin/activate && pip install -q -r requirements.txt && uvicorn app.main:app --host 127.0.0.1 --port 8000';

const npmInstallIfNeeded =
  process.platform === 'win32'
    ? 'if not exist node_modules npm install'
    : 'test -d node_modules || npm install';

// Space before && so CMD does not treat "false&&" as part of the variable value
const notificationCmd =
  process.platform === 'win32'
    ? `set "RABBITMQ_ENABLED=false" && ${npmInstallIfNeeded} && npm start`
    : `export RABBITMQ_ENABLED=false && ${npmInstallIfNeeded} && npm start`;

const cartCmd =
  process.platform === 'win32'
    ? `${npmInstallIfNeeded} && npm start`
    : `${npmInstallIfNeeded} && npm start`;

const frontendCmd =
  process.platform === 'win32'
    ? `${npmInstallIfNeeded} && npm run dev`
    : `${npmInstallIfNeeded} && npm run dev`;

async function main() {
  ensureEnvFile();
  loadRootEnvIntoProcess();
  console.log('Project root:', root);
  console.log(
    'Using .env from repo root (inherited by launched shells). Ensure MongoDB is reachable.\n'
  );

  launch('ECom-Auth', 'auth-service', mvnRun);
  await waitForPort(8081, 'Auth', 240000);
  await sleep(500);

  launch('ECom-User', 'user-service', mvnRun);
  await sleep(800);
  launch('ECom-Product', 'product-service', mvnRun);
  await sleep(800);
  launch('ECom-Inventory', 'inventory-service', mvnRun);
  await sleep(800);
  launch('ECom-Payment', 'payment-service', mvnRun);
  await sleep(1500);
  launch('ECom-Cart', 'cart-service', cartCmd);
  await sleep(800);
  launch('ECom-Notify', 'notification-service', notificationCmd);
  await sleep(800);
  launch('ECom-Analytics', 'analytics-service', analyticsCmd);
  await sleep(1500);
  launch('ECom-Order', 'order-service', mvnRun);
  await waitForPort(8085, 'Order', 240000);
  await sleep(500);

  launch('ECom-Gateway', 'api-gateway', mvnRun);
  await waitForPort(8080, 'API Gateway', 180000);
  await sleep(500);

  launch('ECom-Frontend', 'frontend-react', frontendCmd);

  console.log('\nOpened service windows. Frontend: http://localhost:5173  Gateway: http://localhost:8080\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
