module.exports = {
  apps: [{
    name: 'API Server',
    script: './node_modules/.bin/ts-node',
    args: './src/app.ts',
    instances: 1,
    autorestart: true,
    watch: true,
    env: {
      PORT: 3065,
      NODE_ENV: 'development',
    },
    env_production: {
      PORT: 3065,
      NODE_ENV: 'production',
    },
    max_memory_restart: '2G',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    out_file: 'logs/out.log',
  }],
};
