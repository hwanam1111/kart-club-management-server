module.exports = {
  apps: [{
    name: 'API Server',
    script: './node_modules/.bin/ts-node',
    args: './src/app.ts',
    exec_mode: 'cluster',
    wait_ready: true,
    listen_timeout: 50000,
    env: {
      PORT: 3065,
      NODE_ENV: 'development',
    },
    env_production: {
      PORT: 3065,
      NODE_ENV: 'production',
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    out_file: 'logs/out.log',
  }],
};
