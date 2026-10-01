const path = require("path");

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
      },
      error_log: "./logs/err.log",
      out_log: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
    {
      name: "ekantah-cron-runner",
      cwd: path.resolve(__dirname),
      script: "./node_modules/tsx/dist/cli.mjs",
      args: "./jobs/cron-runner.ts",
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
      },
      error_log: "./logs/cron-err.log",
      out_log: "./logs/cron-out.log",
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
      path: "/home/ubuntu/booking_mesh",
      ssh_options: "StrictHostKeyChecking=no",
      "post-setup":
        "mkdir -p /home/ubuntu/booking_mesh/shared/logs /home/ubuntu/booking_mesh/shared/whatsapp_auth",
      "post-deploy":
        "if [ -f ./scripts/post-deploy.sh ]; then chmod +x ./scripts/post-deploy.sh && ./scripts/post-deploy.sh; else ln -sfn /home/ubuntu/booking_mesh/shared/.env .env && ln -sfn /home/ubuntu/booking_mesh/shared/whatsapp_auth ./whatsapp_auth && ln -sfn /home/ubuntu/booking_mesh/shared/logs ./logs && pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && NODE_OPTIONS='--max-old-space-size=4096' pnpm build && pm2 startOrReload ecosystem.config.js --env production --update-env; fi",
    },
  },
};

