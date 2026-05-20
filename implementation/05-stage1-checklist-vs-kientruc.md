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

- [~] ModSecurity WAF dung nhu kien truc canonical  
  Hien tai: co Nginx edge, chua co rule/engine ModSecurity thuc thi ro rang.

- [x] Co IdP Keycloak container  
  Bang chung: `core/docker-compose.yml`

- [x] Co observability Prometheus + Grafana  
  Bang chung: `core/docker-compose.yml`, `core/observability/prometheus.yml`

- [ ] Co Loki day du (log pipeline theo kien truc)  
  Hien tai: chua thay service Loki trong compose.

- [ ] Co Vault OSS (Transit + KV), rotation key  
  Hien tai: chua co service Vault va policy lien quan.

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
- Muc do khop voi kien truc canonical o lop nen tang: **khoang 60-65%**.
- Da dat: khung edge-gateway-idp-services-observability, backlog/board/DoD day du.
- Chua dat (anh huong den do khop canonical): Vault, Loki, ModSecurity thuc chien, topology da node vat ly.

## D. Viec can lam ngay sau Stage 1 (de sat kien truc thong nhat)

1. Them `vault` service + transit/kv + secret injection cho service.
2. Them `loki` service + log shipping tu gateway/services.
3. Nang Nginx len image co ModSecurity + base rule set.
4. Thay app mock bang service that de enforce D1-D4 bang code.
