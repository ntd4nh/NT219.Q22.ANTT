$ErrorActionPreference = "Stop"
$CertDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CertDir

function Require-OpenSsl {
  if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    throw "Can cai OpenSSL (hoac Git for Windows co openssl.exe trong PATH)."
  }
}

function Clear-CertArtifact {
  param([string]$Name)
  $path = Join-Path $CertDir $Name
  if (-not (Test-Path -LiteralPath $path)) { return }
  $item = Get-Item -LiteralPath $path -Force
  if ($item.PSIsContainer) {
    Write-Host "Xoa thu muc sai ten: $Name (phai la file cert)" -ForegroundColor Yellow
    Remove-Item -LiteralPath $path -Recurse -Force
    return
  }
  attrib -R $path 2>$null
  Remove-Item -LiteralPath $path -Force
}

Require-OpenSsl

$artifacts = @(
  'ca.key', 'ca.crt', 'server.key', 'server.crt', 'server.csr', 'server.ext',
  'client.key', 'client.crt', 'client.csr', 'client.ext', 'ca.srl',
  'order-service.key', 'order-service.crt', 'user-service.key', 'user-service.crt',
  'billing-service.key', 'billing-service.crt', 'auth-service.key', 'auth-service.crt'
)
foreach ($a in $artifacts) { Clear-CertArtifact $a }

Write-Host "Tao CA va cert lab trong $CertDir ..."

openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -subj "/CN=NT219-Lab-CA" -out ca.crt

openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=localhost" -out server.csr
$serverExt = @"
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,IP:127.0.0.1
"@
Set-Content -Path server.ext -Value $serverExt -Encoding ascii
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 825 -sha256 -extfile server.ext

openssl genrsa -out client.key 2048
openssl req -new -key client.key -subj "/CN=nt219-mtls-client" -out client.csr
$clientExt = @"
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=clientAuth
"@
Set-Content -Path client.ext -Value $clientExt -Encoding ascii
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 825 -sha256 -extfile client.ext

foreach ($svc in @('order-service', 'user-service', 'billing-service', 'auth-service')) {
  openssl genrsa -out "$svc.key" 2048
  openssl req -new -key "$svc.key" -subj "/CN=$svc" -out "$svc.csr"
  $svcExt = @"
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=clientAuth,serverAuth
"@
  Set-Content -Path "$svc.ext" -Value $svcExt -Encoding ascii
  openssl x509 -req -in "$svc.csr" -CA ca.crt -CAkey ca.key -CAcreateserial -out "$svc.crt" -days 825 -sha256 -extfile "$svc.ext"
  Remove-Item "$svc.csr" -ErrorAction SilentlyContinue
  Remove-Item "$svc.ext" -ErrorAction SilentlyContinue
}

Remove-Item server.csr, client.csr, server.ext, client.ext, ca.srl -ErrorAction SilentlyContinue

Write-Host "[OK] Da tao: ca.crt, server.crt/key, client.crt/key, *-service.crt/key"
