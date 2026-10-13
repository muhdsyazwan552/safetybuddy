<#
  Deploy from your Windows PC: pushes the current branch, then runs deploy.sh on the server over SSH.

  1. Copy .deploy.env.example to .deploy.env and fill in your server details
  2. Run:   powershell -ExecutionPolicy Bypass -File .\deploy-remote.ps1
            (add -SkipBuild or -NoMigrate to pass those options to the server script)
#>
param(
    [switch]$SkipBuild,
    [switch]$NoMigrate,
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path .deploy.env)) {
    Write-Host "Missing .deploy.env - copy .deploy.env.example and fill it in." -ForegroundColor Red
    exit 1
}

# read KEY=VALUE pairs
$cfg = @{}
Get-Content .deploy.env | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    $cfg[$k.Trim()] = $v.Trim().Trim('"')
}
foreach ($required in 'SSH_HOST', 'SSH_USER', 'REMOTE_PATH') {
    if (-not $cfg[$required]) { Write-Host "$required is not set in .deploy.env" -ForegroundColor Red; exit 1 }
}
$port   = if ($cfg['SSH_PORT'])  { $cfg['SSH_PORT'] }  else { '22' }
$branch = if ($cfg['BRANCH'])    { $cfg['BRANCH'] }    else { 'main' }
$key    = $cfg['SSH_KEY']

# make sure nothing is left uncommitted
if (-not $NoPush) {
    $dirty = git status --porcelain
    if ($dirty) {
        Write-Host "You have uncommitted changes. Commit them first:" -ForegroundColor Yellow
        Write-Host $dirty
        exit 1
    }
    Write-Host "==> Pushing $branch to origin (pre-push hook runs the build check)" -ForegroundColor Yellow
    git push origin $branch
    if ($LASTEXITCODE -ne 0) { Write-Host "Push failed - deploy cancelled." -ForegroundColor Red; exit 1 }
}

$flags = @("--branch=$branch")
if ($SkipBuild) { $flags += '--skip-build' }
if ($NoMigrate) { $flags += '--no-migrate' }

$sshArgs = @('-p', $port)
if ($key) { $sshArgs += @('-i', $key) }
$remoteCmd = "cd '$($cfg['REMOTE_PATH'])' && bash deploy.sh $($flags -join ' ')"

Write-Host "==> Deploying on $($cfg['SSH_USER'])@$($cfg['SSH_HOST'])" -ForegroundColor Yellow
ssh @sshArgs "$($cfg['SSH_USER'])@$($cfg['SSH_HOST'])" $remoteCmd
if ($LASTEXITCODE -ne 0) { Write-Host "Deploy FAILED." -ForegroundColor Red; exit $LASTEXITCODE }
Write-Host "Deploy complete." -ForegroundColor Green
