[CmdletBinding()]
param(
  [string]$ContainerName = "datashare-db-demo",
  [string]$Image = "postgres:16",
  [int]$Port = 5432
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
$dbPassword = if ($envMap.ContainsKey("DB_PASSWORD")) { $envMap["DB_PASSWORD"] } else { "demo" }
$dbName = if ($envMap.ContainsKey("DB_NAME")) { $envMap["DB_NAME"] } else { "datashare_db_demo" }

$exists = (docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName } | Measure-Object).Count -gt 0

if (-not $exists) {
  Write-Host "[db] Creating container '$ContainerName' ($Image) on port $Port..."
  docker run --name $ContainerName `
    -e POSTGRES_USER=$dbUser `
    -e POSTGRES_PASSWORD=$dbPassword `
    -e POSTGRES_DB=$dbName `
    -p "${Port}:5432" `
    -d $Image | Out-Null
} else {
  $running = (docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName } | Measure-Object).Count -gt 0
  if (-not $running) {
    Write-Host "[db] Starting existing container '$ContainerName'..."
    docker start $ContainerName | Out-Null
  } else {
    Write-Host "[db] Container '$ContainerName' already running."
  }
}

Write-Host "[db] Waiting for PostgreSQL to be ready..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    docker exec $ContainerName pg_isready -U $dbUser -d $dbName | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  } catch {
    # ignore transient failures
  }
  Start-Sleep -Seconds 1
}

if (-not $ready) {
  throw "PostgreSQL n'est pas prêt après 60s. Vérifie 'docker logs $ContainerName'."
}

Write-Host "[db] PostgreSQL is ready."
Write-Host "[db] Next: run .\scripts\db\migrate.ps1"
