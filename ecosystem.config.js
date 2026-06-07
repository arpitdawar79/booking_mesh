const path = require("path");

module.exports = {
  apps: [
    {
      name: "ekantah-email-templates",
      cwd: path.resolve(__dirname),
      script: "./node_modules/.bin/next",
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
      script: "./node_modules/.bin/tsx",
      args: "./jobs/cron-runner.ts",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      error_log: "./logs/cron-err.log",
      out_log: "./logs/cron-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
    },
  ],
};
