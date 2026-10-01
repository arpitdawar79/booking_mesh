const path = require("path");

const deployPath = "/home/ubuntu/apps/booking_mesh";
const deployKey = process.env.PM2_DEPLOY_KEY;
const logPath = process.env.PM2_LOG_DIR || path.resolve(__dirname, "logs");

module.exports = {
  apps: [
    {
      name: "ekantah-email-templates",
      cwd: path.resolve(__dirname),
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5050,
        WHATSAPP_AUTH_DIR: path.join(deployPath, "shared/whatsapp_auth"),
      },
      error_log: path.join(logPath, "err.log"),
      out_log: path.join(logPath, "out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
    {
      name: "ekantah-cron-runner",
      cwd: path.resolve(__dirname),
      script: "./node_modules/tsx/dist/cli.mjs",
      args: "./jobs/cron-runner.ts",
      node_args: "--env-file=.env",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        NODE_OPTIONS: "--conditions=import",
      },
      env_production: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--conditions=import",
        WHATSAPP_AUTH_DIR: path.join(deployPath, "shared/whatsapp_auth"),
      },
      error_log: path.join(logPath, "cron-err.log"),
      out_log: path.join(logPath, "cron-out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
  ],

  deploy: {
    production: {
      user: "ubuntu",
      host: ["18.60.147.134"],
      ref: "origin/main",
      repo: "git@github.com:arpitdawar79/booking_mesh.git",
      path: deployPath,
      ssh_options: "StrictHostKeyChecking=accept-new",
      ...(deployKey ? { key: deployKey } : {}),
      "post-setup": [
        `mkdir -p '${deployPath}/shared/logs' '${deployPath}/shared/whatsapp_auth'`,
        `chmod 700 '${deployPath}/shared'`,
        `if [ ! -s '${deployPath}/shared/.env' ] && [ -s '/home/ubuntu/booking_mesh/shared/.env' ]; then cp '/home/ubuntu/booking_mesh/shared/.env' '${deployPath}/shared/.env'; fi`,
        `if [ -d '/home/ubuntu/booking_mesh/shared/whatsapp_auth' ]; then cp -an '/home/ubuntu/booking_mesh/shared/whatsapp_auth/.' '${deployPath}/shared/whatsapp_auth/'; fi`,
        `test -s '${deployPath}/shared/.env'`,
        `chmod 600 '${deployPath}/shared/.env'`,
      ].join(" && "),
      "post-deploy": "./scripts/post-deploy.sh",
    },
  },
};

