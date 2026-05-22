# Demo runbook 10 phut

## Phan vai live demo
- TV1: Security intro + D2/D3.
- TV2: Business/API flow + D1/D4.
- TV3: Infrastructure + metrics + ket luan.

## Timeline
1. 00:00-01:30 - Boi canh, kien truc, muc tieu G1-G3.
2. 01:30-03:30 - Demo D1 BOLA (baseline -> hardened).
3. 03:30-05:00 - Demo D2 token replay.
4. 05:00-06:30 - Demo D3 webhook forged.
5. 06:30-08:00 - Demo D4 SSRF block.
6. 08:00-09:00 - Bang metrics baseline vs hardened.
7. 09:00-10:00 - Tong ket + Q&A.

## Lenh chuan bi
```powershell
cd core
docker compose up -d
cd ../security
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

## Backup plan khi loi demo
- Chuyen sang video/screenshot da quay truoc.
- Dung file `metrics/g3-baseline-vs-hardened.csv` va log luu san.
