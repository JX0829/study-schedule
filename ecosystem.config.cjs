/**
 * PM2 Ecosystem Configuration
 * 
 * 管理 StudyPlan 的所有服务进程
 * 
 * 使用：
 *   pm2 start ecosystem.config.js     # 启动所有
 *   pm2 status                         # 查看状态
 *   pm2 logs                           # 查看日志
 *   pm2 restart all                    # 重启所有
 *   pm2 stop all                       # 停止所有
 *   pm2 save                           # 保存进程列表（开机自启用）
 *   pm2 startup                        # 设置开机自启
 */

module.exports = {
  apps: [
    {
      name: 'studyplan-server',
      cwd: './server',
      script: 'index.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        MONGO_URL: 'mongodb://192.168.31.170:27017',
      },
      // 自动重启配置
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      max_memory_restart: '200M',
      // 日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      merge_logs: true,
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    {
      name: 'studyplan-vite',
      cwd: '.',
      script: 'node_modules/.bin/vite',
      args: '--host 0.0.0.0 --port 3333',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/vite-error.log',
      out_file: './logs/vite-out.log',
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 15000,
    },
  ],
};
