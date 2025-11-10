# 本番モードでDockerコンテナを起動
Write-Host "🏭 Starting production mode..." -ForegroundColor Green
Write-Host "Building and optimizing for production..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
