import "./sites-env.mjs";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const mode = process.argv[2];
if (!["login", "whoami", "build", "check", "deploy"].includes(mode)) {
  throw new Error("Use login, whoami, build, check or deploy.");
}
const wrangler = "./node_modules/wrangler/bin/wrangler.js";
function run(args, extraEnv = {}) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
if (mode === "login" || mode === "whoami") {
  run([wrangler, mode]);
} else {
  // Always rebuild so a Sites artifact cannot accidentally be deployed here.
  run(["./node_modules/vinext/dist/cli.js", "build"], {
    TIVZO_DEPLOY_TARGET: "cloudflare",
  });
  const config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
  if (
    config.name !== "tivzo" ||
    config.workers_dev !== true ||
    config.services?.length
  ) {
    throw new Error("Unexpected deployment config. No upload attempted.");
  }
  if (mode !== "build") {
    run([
      wrangler,
      "deploy",
      "--config",
      "dist/server/wrangler.json",
      ...(mode === "check" ? ["--dry-run"] : []),
    ]);
  }
}
