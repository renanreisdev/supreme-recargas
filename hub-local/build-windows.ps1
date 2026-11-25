$ErrorActionPreference = 'Stop'

$HubRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistDir = Join-Path $HubRoot 'dist'
if (-not (Test-Path $DistDir)) {
  New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

function Find-GoExe {
  $cmd = Get-Command go -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @('C:\Program Files\Go\bin\go.exe', 'C:\Go\bin\go.exe')) {
    if (Test-Path $p) { return $p }
  }
  throw 'go.exe nao encontrado.'
}

function Find-IsccExe {
  $cmd = Get-Command iscc -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
    'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
    'C:\Program Files\Inno Setup 6\ISCC.exe',
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Antigravity IDE\resources\app\node_modules\innosetup\bin\ISCC.exe"
  )) {
    if (Test-Path $p) { return $p }
  }
  $regPaths = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Inno Setup 6_is1',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Inno Setup 6_is1',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Inno Setup 6_is1'
  )
  foreach ($rp in $regPaths) {
    if (Test-Path $rp) {
      $loc = (Get-ItemProperty $rp -ErrorAction SilentlyContinue).InstallLocation
      if ($loc -and (Test-Path (Join-Path $loc 'ISCC.exe'))) {
        return (Join-Path $loc 'ISCC.exe')
      }
    }
  }
  throw 'ISCC.exe (Inno Setup 6) nao encontrado.'
}

$GoExe = Find-GoExe
$IsccExe = Find-IsccExe
Write-Host "[1/4] Usando Go: $GoExe" -ForegroundColor Cyan
Write-Host "[1/4] Usando ISCC: $IsccExe" -ForegroundColor Cyan

Push-Location $HubRoot
try {
  Write-Host '[2/4] Executando testes nativos Go...' -ForegroundColor Cyan
  & $GoExe test -v ./...
  if ($LASTEXITCODE -ne 0) { throw 'Falha nos testes Go' }

  Write-Host '[3/4] Compilando AgilOS-Hub.exe (Windows amd64 GUI)...' -ForegroundColor Cyan
  $env:GOOS = 'windows'
  $env:GOARCH = 'amd64'
  & $GoExe build -trimpath -ldflags '-s -w -H=windowsgui' -o (Join-Path $DistDir 'AgilOS-Hub.exe') .
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar AgilOS-Hub.exe' }

  Write-Host '[4/4] Compilando instalador AgilOS-Hub-Setup.exe via Inno Setup...' -ForegroundColor Cyan
  & $IsccExe (Join-Path $HubRoot 'installer.iss')
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar AgilOS-Hub-Setup.exe' }

  $hashLines = @()
  foreach ($fileName in @('AgilOS-Hub-Setup.exe', 'AgilOS-Hub.exe')) {
    $full = Join-Path $DistDir $fileName
    $h = (Get-FileHash -Path $full -Algorithm SHA256).Hash.ToLower()
    $hashLines += "$h  $fileName"
    $sizeMb = [Math]::Round((Get-Item $full).Length / 1MB, 2)
    Write-Host " -> $fileName ($sizeMb MB) SHA256: $h" -ForegroundColor Green
  }
  [System.IO.File]::WriteAllLines((Join-Path $DistDir 'SHA256SUMS.txt'), $hashLines)
} finally {
  Pop-Location
}
