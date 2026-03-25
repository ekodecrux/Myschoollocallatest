// PM2 Ecosystem Configuration for MySchool Backend

module.exports = {
  apps: [
    {
      name: 'myschool-backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001 --workers 4',
      cwd: '/var/www/myschool/backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/myschool/logs/backend-error.log',
      out_file: '/var/www/myschool/logs/backend-out.log',
      log_file: '/var/www/myschool/logs/backend-combined.log',
      time: true
    }
  ]
};
