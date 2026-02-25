[CmdletBinding()]
param(
  [string]$ContainerName = "datashare-db-demo"
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
$envFile = Join-Path $repoRoot "backend\.env"
$envMap = Get-EnvFromFile -Path $envFile

$dbUser = if ($envMap.ContainsKey("DB_USER")) { $envMap["DB_USER"] } else { "demo" }
$dbName = if ($envMap.ContainsKey("DB_NAME")) { $envMap["DB_NAME"] } else { "datashare_db_demo" }

$migration = Join-Path $repoRoot "backend\migrations\001_init.sql"
if (-not (Test-Path -Path $migration)) {
  throw "Migration introuvable: $migration"
}

$running = (docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName } | Measure-Object).Count -gt 0
if (-not $running) {
  throw "Le container '$ContainerName' n'est pas démarré. Lance d'abord .\scripts\db\docker-up.ps1"
}

Write-Host "[db] Applying migration backend/migrations/001_init.sql..."
Get-Content -Raw -Path $migration | docker exec -i $ContainerName psql -U $dbUser -d $dbName
if ($LASTEXITCODE -ne 0) {
  throw "Migration échouée (psql exit code $LASTEXITCODE)."
}

Write-Host "[db] Verifying tables exist..."
$checkSql = "SELECT to_regclass('public.users') AS users, to_regclass('public.files') AS files;"
$check = docker exec -i $ContainerName psql -U $dbUser -d $dbName -t -A -c $checkSql
Write-Host "[db] $check"
Write-Host "[db] Done."
