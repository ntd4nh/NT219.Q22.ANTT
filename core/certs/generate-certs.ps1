$ErrorActionPreference = "Stop"
$CertDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CertDir

function Require-OpenSsl {
  if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    throw "Can cai OpenSSL (hoac Git for Windows co openssl.exe trong PATH)."
  }
}

Require-OpenSsl

Write-Host "Tao CA va cert lab trong $CertDir ..."

openssl genrsa -out ca.key 4096 2>$null
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -subj "/CN=NT219-Lab-CA" -out ca.crt

openssl genrsa -out server.key 2048 2>$null
openssl req -new -key server.key -subj "/CN=localhost" -out server.csr
$serverExt = @"
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,IP:127.0.0.1
"@
Set-Content -Path server.ext -Value $serverExt -Encoding ascii
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 825 -sha256 -extfile server.ext

openssl genrsa -out client.key 2048 2>$null
openssl req -new -key client.key -subj "/CN=nt219-mtls-client" -out client.csr
$clientExt = @"
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=clientAuth
"@
Set-Content -Path client.ext -Value $clientExt -Encoding ascii
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 825 -sha256 -extfile client.ext

foreach ($svc in @('order-service', 'user-service', 'billing-service', 'auth-service')) {
  openssl genrsa -out "$svc.key" 2048 2>$null
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
