[CmdletBinding()]
param(
  [string]$EnvFile = ".env.demo.example",
  [string]$ProjectName = "datashare_db_demo"
)

$ErrorActionPreference = "Stop"

function Get-EnvFromFile {
  param([string]$Path)

  $map = @{}
  if (-not (Test-Path -Path $Path)) {
    return $map
  }

  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith('#')) { return }

    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }

    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()

    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      $val = $val.Substring(1, $val.Length - 2)
    }

    $map[$key] = $val
  }

  return $map
}

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

$envMap = Get-EnvFromFile -Path $envPath
$dbUser = if ($envMap.ContainsKey("DB_USER")) { $envMap["DB_USER"] } else { "demo" }
$dbName = if ($envMap.ContainsKey("DB_NAME")) { $envMap["DB_NAME"] } else { "datashare_db_demo" }

$migration = Join-Path $repoRoot "backend\migrations\001_init.sql"
if (-not (Test-Path -Path $migration)) {
  throw "Migration introuvable: $migration"
}

Push-Location $repoRoot
try {
  $running = (docker compose -p $ProjectName ps --status running --services | Where-Object { $_ -eq "db" } | Measure-Object).Count -gt 0
  if (-not $running) {
    throw "Le service 'db' n'est pas en cours. Lance d'abord .\scripts\demo\docker-up.ps1"
  }

  Write-Host "[demo] Applying migration backend/migrations/001_init.sql (compose service: db)..."
  Get-Content -Raw -Path $migration | docker compose -p $ProjectName --env-file $envPath exec -T db psql -U $dbUser -d $dbName
  if ($LASTEXITCODE -ne 0) {
    throw "Migration échouée (psql exit code $LASTEXITCODE)."
  }

  Write-Host "[demo] Verifying tables exist..."
  $checkSql = "SELECT to_regclass('public.users') AS users, to_regclass('public.files') AS files;"
  $check = docker compose -p $ProjectName --env-file $envPath exec -T db psql -U $dbUser -d $dbName -t -A -c $checkSql
  Write-Host "[demo] $check"
  Write-Host "[demo] Done."
} finally {
  Pop-Location
}
