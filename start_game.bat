@echo off
echo [1/2] Terminating stale processes...
powershell -Command "Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -ge 3000 -and $_.LocalPort -le 5200 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"

echo [2/2] Starting Badam Satti...
start cmd /k "cd server && npm run dev"
start cmd /k "cd client && npm run dev"

echo Done! Two terminal windows should open now.
pause
