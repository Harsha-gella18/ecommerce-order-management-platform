# Opens CMD windows (Maven / Node / Python) on localhost.
# Prerequisites: JDK 11+, Maven, Node, Python on PATH; MongoDB reachable (localhost or .env / Atlas).
# RabbitMQ is NOT required (order/payment use profile "local"; notification has RABBITMQ_ENABLED=false).
# Usage:  pwsh ./scripts/start-local.ps1   or   npm run local
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$Root\.env") -and (Test-Path "$Root\.env.example")) {
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Warning "Created .env from .env.example — set JWT_SECRET before production.`n"
} elseif (-not (Test-Path "$Root\.env")) {
    Write-Warning "No .env found. Copy .env.example to .env in the repo root.`n"
}

Write-Host "Project root: $Root"
Write-Host "Ensure MongoDB is reachable (e.g. mongodb://127.0.0.1:27017 or root .env URIs).`n"

function StartWin {
    param([string]$Cmd)
    Start-Process cmd -ArgumentList @("/k", $Cmd) -WindowStyle Normal
}

$analyticsCmd = 'if not exist .venv (python -m venv .venv 2>nul & if not exist .venv py -3 -m venv .venv) & call .venv\Scripts\activate.bat & pip install -q -r requirements.txt & uvicorn app.main:app --host 127.0.0.1 --port 8000'

StartWin "cd /d `"$Root\auth-service`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 2
StartWin "cd /d `"$Root\user-service`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 1
StartWin "cd /d `"$Root\product-service`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 1
StartWin "cd /d `"$Root\inventory-service`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 1
StartWin "cd /d `"$Root\payment-service`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 2
StartWin "cd /d `"$Root\cart-service`" && if not exist node_modules npm install && npm start"
Start-Sleep -Seconds 1
StartWin "cd /d `"$Root\notification-service`" && set `"RABBITMQ_ENABLED=false`" && if not exist node_modules npm install && npm start"
Start-Sleep -Seconds 1
StartWin "cd /d `"$Root\analytics-service`" && $analyticsCmd"
Start-Sleep -Seconds 2
StartWin "cd /d `"$Root\order-service`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 4
StartWin "cd /d `"$Root\api-gateway`" && mvn -ntp spring-boot:run"
Start-Sleep -Seconds 6
StartWin "cd /d `"$Root\frontend-react`" && if not exist node_modules npm install && npm run dev"

Write-Host ""
Write-Host "Opened service windows. Frontend: http://localhost:5173  Gateway: http://localhost:8080"
