#!/bin/bash
#
# StudyPlan 服务管理脚本
# 
# 用法:
#   ./start.sh             启动所有服务
#   ./start.sh stop        停止所有服务
#   ./start.sh restart     重启所有服务
#   ./start.sh status      查看服务状态
#   ./start.sh logs        查看日志
#   ./start.sh health      健康检查
#
# 确保 MongoDB 在 192.168.31.170:27017 上运行

set -e

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# 确保日志目录存在
mkdir -p "$SCRIPT_DIR/logs"

# 检查 PM2
check_pm2() {
  if ! command -v pm2 &> /dev/null; then
    log_err "PM2 未安装，请运行: npm install -g pm2"
    exit 1
  fi
}

# 启动服务
start_all() {
  check_pm2
  
  log_info "启动 StudyPlan 服务..."

  # 先确保 server 依赖已安装
  if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    log_info "安装 server 依赖..."
    cd "$SCRIPT_DIR/server"
    npm install
    cd "$SCRIPT_DIR"
  fi

  # 使用 ecosystem 配置启动
  pm2 start "$SCRIPT_DIR/ecosystem.config.cjs"
  
  # 保存 PM2 进程列表
  pm2 save

  echo ""
  log_ok "服务启动完成！"
  echo ""
  echo "  🌐 孩子端:  http://localhost:3333/"
  echo "  👨‍👩‍👧 家长端: http://localhost:3333/parent/index.html"
  echo "  🔧 后端 API: http://localhost:3002/api/health"
  echo ""
  echo "  管理命令:"
  echo "    pm2 status         查看状态"
  echo "    pm2 logs           查看日志"
  echo "    ./start.sh stop    停止服务"
  echo "    ./start.sh restart 重启服务"
  echo ""
}

# 停止服务
stop_all() {
  check_pm2
  log_info "停止 StudyPlan 服务..."
  pm2 stop studyplan-server studyplan-vite 2>/dev/null || true
  log_ok "服务已停止"
}

# 重启服务
restart_all() {
  check_pm2
  log_info "重启 StudyPlan 服务..."
  pm2 restart studyplan-server studyplan-vite 2>/dev/null || start_all
  pm2 save
  log_ok "服务已重启"
}

# 查看状态
show_status() {
  check_pm2
  pm2 status
  
  echo ""
  log_info "健康检查..."
  
  # 检查后端
  if curl -s --connect-timeout 3 http://localhost:3002/api/health > /dev/null 2>&1; then
    log_ok "后端服务 (3002) ✅"
  else
    log_err "后端服务 (3002) ❌"
  fi
  
  # 检查前端
  if curl -s --connect-timeout 3 http://localhost:3333/ > /dev/null 2>&1; then
    log_ok "前端服务 (3333) ✅"
  else
    log_err "前端服务 (3333) ❌"
  fi
}

# 查看日志
show_logs() {
  check_pm2
  pm2 logs studyplan-server studyplan-vite
}

# 健康检查
health_check() {
  echo "=== StudyPlan 健康检查 $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""

  # 后端
  BackendResult=$(curl -s --connect-timeout 5 http://localhost:3002/api/health 2>&1)
  if [ $? -eq 0 ]; then
    echo "✅ 后端: $BackendResult"
  else
    echo "❌ 后端无响应"
  fi

  # 前端
  FrontendCode=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:3333/ 2>/dev/null)
  if [ "$FrontendCode" = "200" ]; then
    echo "✅ 前端: HTTP $FrontendCode"
  else
    echo "❌ 前端: HTTP ${FrontendCode:-无响应}"
  fi

  echo ""
}

# 主逻辑
case "${1:-start}" in
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    restart_all
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs
    ;;
  health)
    health_check
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status|logs|health}"
    exit 1
    ;;
esac
