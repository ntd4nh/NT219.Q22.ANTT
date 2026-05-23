# Checklist doi chieu voi kien truc thong nhat (Stage 1)

## Quy uoc trang thai
- `[x]` Da hoan thanh
- `[~]` Hoan thanh mot phan
- `[ ]` Chua hoan thanh

## A. Doi chieu cac nen tang trong `docs/Kien-truc-he-thong-NT219.md`

- [x] Single-region, self-host, khong dung cloud tra phi  
  Bang chung: `core/docker-compose.yml`, `core/README.md`

- [x] Co Edge + API Gateway (Nginx + Kong)  
  Bang chung: `core/docker-compose.yml`, `core/nginx/nginx.conf`, `core/kong/kong.yml`

- [x] ModSecurity WAF dung nhu kien truc canonical  
  Bang chung: `core/nginx/Dockerfile` (OWASP CRS), `core/nginx/modsecurity-custom.conf`.

- [x] Co IdP Keycloak container  
  Bang chung: `core/docker-compose.yml`

- [x] Co observability Prometheus + Grafana  
  Bang chung: `core/docker-compose.yml`, `core/observability/prometheus.yml`

- [x] Co Loki day du (log pipeline theo kien truc)  
  Bang chung: `core/docker-compose.yml`, `core/loki/loki-config.yml`, `core/promtail/promtail-config.yml`.

- [x] Co Vault OSS (Transit + KV), rotation key  
  Bang chung: `core/docker-compose.yml`, `core/vault/config.hcl`, `core/vault/init-dev.ps1`.

- [x] Co skeleton app services (Order/User/Billing)  
  Bang chung: `core/docker-compose.yml` (dang o dang mock service).

- [~] Docker phan tan da node dung nghia vat ly  
  Hien tai: da tach role theo service/network logic, chua co nhieu host node vat ly.

## B. Checklist Stage 1 (Ngay 1-2) theo plan

- [x] Chot backlog D1-D4 + tieu chi pass/fail + owner/deadline  
  Bang chung: `implementation/01-scope-kickoff.md`

- [x] Tao board cong viec theo ngay cho 13 ngay  
  Bang chung: `implementation/02-day-by-day-board.md`

- [x] Co Definition of Done va quy uoc branch  
  Bang chung: `implementation/01-scope-kickoff.md`

- [x] Dung skeleton repo (gateway, idp, app, observability)  
  Bang chung: `core/docker-compose.yml`

- [x] Co README chay nhanh local  
  Bang chung: `core/README.md`

- [x] Dat muc tieu output Stage 1: stack khung co the khoi dong bang docker compose  
  Bang chung: `core/docker-compose.yml` + huong dan run.

## C. Bao cao tong hop Stage 1

- Muc do hoan thanh Stage 1 (theo plan): **100%**.
- Muc do khop voi kien truc canonical o lop nen tang: **khoang 90-95%**.
- Da dat: khung edge-gateway-idp-services-observability, backlog/board/DoD day du.
- Chua dat (anh huong den do khop canonical): topology da node vat ly va app service thuc thi D1-D4 bang code that.

## D. Viec can lam ngay sau Stage 1 (de sat kien truc thong nhat)

1. Thay app mock bang service that de enforce D1-D4 bang code.
2. Hoan thien script do baseline vs hardened theo protocol G3.
3. Chot bo evidence (log/metric/screenshot) cho demo va bao cao.
4. Danh gia phuong an tach node vat ly neu can mo rong sau lab.
