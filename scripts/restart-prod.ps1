# 本番モードでDockerコンテナを再起動（ビルドなし）
Write-Host "🔄 Restarting production mode (no rebuild)..." -ForegroundColor Green
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
