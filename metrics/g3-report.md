# G3 Validation Report (Baseline vs Hardened)

## Muc tieu
- So sanh hieu qua phong thu D1-D4 giua baseline va hardened.
- Bao cao chi so: ty le chan tan cong, p95 latency, error rate.

## Cach chay
1. Chay baseline (tat/muc toi thieu policy).
2. Chay bo test D1-D4.
3. Ghi so lieu vao `g3-baseline-vs-hardened.csv`.
4. Bat hardened policy day du.
5. Chay lai bo test D1-D4 va cap nhat file CSV.

## Ket qua tom tat (tu file CSV hien tai)
- D1: 20% -> 100% attack block rate.
- D2: 35% -> 100%.
- D3: 10% -> 100%.
- D4: 25% -> 100%.
- p95 tang nhe (khoang 10-18ms), doi lai tang do bao ve.

## Ket luan
- Hardened mode dat yeu cau G3 cho 4 kich ban D1-D4.
- Can duy tri can bang hieu nang va policy tuning de giam p95.
