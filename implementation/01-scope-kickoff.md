# Scope Kickoff - D1-D4

## Backlog chot scope

| ID | Kich ban | Muc tieu | Tieu chi pass/fail | Owner | Deadline |
|---|---|---|---|---|---|
| D1 | BOLA doi `order_id` | Chan truy cap cheo tenant | Pass: 100% request trai phep -> 403; Fail: co request 200/201 | TV1 + TV2 | Ngay 6 |
| D2 | Token replay / token het han | Chan token cu, token revoke | Pass: token het han/revoke -> 401; refresh cu bi tu choi | TV1 | Ngay 7 |
| D3 | Webhook forged khong HMAC hop le | Chan tu ingress Billing | Pass: 100% forged -> 401; hop le -> 2xx | TV1 + TV2 | Ngay 8 |
| D4 | SSRF qua endpoint fetch URL | Chan truy cap metadata/IP noi bo | Pass: khong truy cap `169.254.169.254`; log blocked | TV2 + TV3 | Ngay 9 |

## Definition of Done

- Co code + config chay duoc bang `docker compose up`.
- Co test script tai lieu hoa buoc test va expected result.
- Co log/chung cu ket qua baseline va hardened.
- Co cap nhat README huong dan chay.

## Quy uoc branch

- `main`: nhanh on dinh.
- `feat/d1-bola-authz`
- `feat/d2-token-lifecycle`
- `feat/d3-webhook-hmac`
- `feat/d4-ssrf-guard`
- `chore/metrics-and-packaging`

## Nhip lam viec hang ngay

- 09:00 standup 20 phut.
- 14:00 sync blocker 15 phut.
- 21:30 demo noi bo + cap nhat board.
