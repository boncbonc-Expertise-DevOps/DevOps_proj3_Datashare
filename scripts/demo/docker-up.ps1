[CmdletBinding()]
param(
  [string]$EnvFile = ".env.demo.example",
  [string]$ProjectName = "datashare_db_demo"
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Cmd)
  if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
    throw "Commande introuvable: $Cmd. Installe-la et réessaie."
  }
}

Require-Command -Cmd "docker"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path
$envPath = Join-Path $repoRoot $EnvFile

if (-not (Test-Path -Path $envPath)) {
  throw "Fichier d'env introuvable: $envPath"
}

Write-Host "[demo] Starting db + backend with docker compose (env: $EnvFile)..."
Push-Location $repoRoot
try {
  docker compose -p $ProjectName --env-file $envPath up -d --build
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose up a échoué (exit code $LASTEXITCODE)."
  }
} finally {
  Pop-Location
}

Write-Host "[demo] Stack started. Useful URLs:"
Write-Host "[demo] - Backend health: http://localhost:3000/health"
Write-Host "[demo] - Swagger:       http://localhost:3000/api-docs"
Write-Host "[demo] Next: run .\scripts\demo\migrate.ps1"
