# FOUNDATION CLOSURE REPORT — MONICA ONE

| Trường | Giá trị |
|---|---|
| **Mã hồ sơ** | `FCR-001` |
| **Ngày lập** | 2026-08-05 |
| **Người lập** | Chief Solution Architect *(thẩm quyền [ADR-011](../adr/ADR-011-tham-quyen-kien-truc.md))* |
| **Phạm vi** | Architecture · Security · RLS · Permission · Verification · Migration `041`–`046` · ADR-018 · ADR-019 · ADR-020 · Decision Log · Architecture Baseline · Project Memory |
| **Loại** | Audit — ⛔ **không migration · ⛔ không ADR · ⛔ không sửa mã** |
| **Nguyên tắc** | `P-MEASURE` — mọi kết luận có nhãn `[MEASURED]` · `[PROVEN]` · `[INFERRED]` · `[NO EVIDENCE]` |
| **Kiến nghị Revision 1** | 🔴 `FOUNDATION NOT COMPLETE` — xem §E |
| **Phán quyết Board** | 🔴 **BÁC kiến nghị Revision 1** — 05/08/2026. Xem **Revision 2** |
| **Kết luận có hiệu lực** | ✅ **Technical Foundation COMPLETE** *(`TFC-001`)* · 🟠 **Governance PENDING** *(`GPR-001`)* · ✅ **Sprint I-2 được khởi động** |

---

# REVISION 2 — BOARD DECISION 05/08/2026

> ⚠️ **§A–§F bên dưới GIỮ NGUYÊN VĂN.** Hiến pháp Điều 43.7 cấm viết lại lịch
> sử; `docs/review/README.md` `R-4` cấm sửa hồ sơ sau phán quyết. Revision 2
> **thêm vào**, ⛔ không sửa.

## R2.1 Board bác gì

> *"Không chấp nhận kết luận Foundation NOT COMPLETE. Tách Foundation thành
> Technical Foundation và Governance Foundation. Không chặn Sprint I-2 chỉ vì
> tài liệu, ADR hoặc certificate chưa hoàn tất. Chỉ chặn Sprint khi còn tồn tại
> Technical Blocker."*

## R2.2 Vì sao Board đúng và tôi sai

Kiến nghị Revision 1 sai ở **một chỗ cụ thể, ⛔ không phải ở dữ liệu**. Toàn bộ
phép đo của §A–§D vẫn đứng — Board ⛔ không bác một con số nào.

Cái sai là **phép hợp nhất**: tôi trộn hai loại rủi ro khác hẳn bản chất vào
**một** kết luận nhị phân, rồi để loại rủi ro **chậm** *(quản trị: hồ sơ, chữ
ký, tài liệu)* chặn loại rủi ro **nhanh** *(kỹ thuật: mã, policy, bài kiểm)*.

Và hệ quả của phép trộn đó tự lộ ra khi phân loại lại:

> 🔑 **`V-4` *(MD ⛔ không có bài kiểm nghiệp vụ)* và `V-5` *(`TD-03` phép kiểm
> vốn từ)* — hai trong năm phát hiện tôi xếp nặng nhất — CHÍNH LÀ điều kiện ra
> và phạm vi của Sprint I-2.**
>
> Chặn Sprint I-2 vì chúng là **chặn một Sprint bằng chính mục tiêu của nó**.
> Đó là một vòng lặp logic, ⛔ không phải một cổng an toàn.

## R2.3 Phân loại lại — kết quả

Định nghĩa **Technical Blocker** ba điều kiện `TB-a`/`TB-b`/`TB-c` ở
[`TFC-001`](TECHNICAL_FOUNDATION_CERTIFICATE.md) §1, áp lên **16 phát hiện kỹ
thuật** của §B:

```
🔴 Technical Blocker cho Sprint I-2   ⛔  K H Ô N G   C Ó
🟠 Technical Condition                    3  — TC-1 (Cổng C) · TC-2 (I-4) · TC-3 (Cổng C)
✅ Nằm TRONG phạm vi Sprint I-2           5  — TD-17 · TD-18 · TD-27 · V-4 · V-5
⏳ Technical Debt có Sprint đích          7
🟠 Governance Pending                    24  — GPR-001 · ⛔ 0 mục chặn I-2
```

## R2.4 Hai hồ sơ thay thế kết luận §E

| Hồ sơ | Nội dung | Trạng thái |
|---|---|---|
| [`TFC-001`](TECHNICAL_FOUNDATION_CERTIFICATE.md) | **Technical Foundation Completion Certificate** — 10/11 bài kiểm xanh, 3 cổng tĩnh sạch, 0 Technical Blocker | ✅ **PHÁT HÀNH** |
| [`GPR-001`](GOVERNANCE_PENDING_REPORT.md) | **Governance Pending Report** — 24 mục · 5 nhóm · có tên, có chủ, có hạn | 🟠 **PHÁT HÀNH** |

## R2.5 Điều tôi giữ nguyên, và vì sao

Board nói *"⛔ không chặn"*. Board **⛔ không** nói *"⛔ không tồn tại"*. Vì vậy
`GPR-001` ghi đủ **24 mục** thay vì rút gọn, và §B của tài liệu này ⛔ không bị
xoá một dòng nào.

Ba mục tôi **giữ nguyên mức 🔴** trong `GPR-001` dù chúng ⛔ không chặn gì:

| Mục | Vì sao vẫn 🔴 |
|---|---|
| `A-1` | 5 migration chạy dưới 3 ADR chưa duyệt. ⛔ Không chặn mã, nhưng làm **truy vết** ⛔ không trả lời được |
| `A-3` | SECURITY FREEZE mở trên giấy, bị vượt trên thực tế. **Một luật ⛔ không ai tuân mà cũng ⛔ không ai gỡ làm mọi luật còn lại mất trọng lượng** |
| `B-1` | `PROJECT_MEMORY` sai ⇒ **mọi phiên mới khởi động bằng tiền đề sai** — đúng sự cố ADR-010 đã phải sửa một lần |

⇒ Ba mục này ⛔ không chặn Sprint I-2. Chúng **chặn Cổng C**, và `GPR-001` §6
ghi rõ như vậy.

---

## §0 · BỐI CẢNH ĐO

> Bắt buộc theo `P-MEASURE` vế ②. Kết luận trong tài liệu này **chỉ có giá trị
> với đúng trạng thái dưới đây**.

```
CSDL                mnxatxbadgrrolwpmxne.supabase.co
Thời điểm đo        2026-08-05T01:30Z  (08:30 giờ VN)
Migration trong KHO 54 tệp · mới nhất 045 · 045b · 046
Commit              4e69538d
Nhánh               main · cây làm việc sạch
Phép đo chạy lại    npm run typecheck · npm run lint · npm test  (toàn bộ 9 bài)
```

**Ba phép đo tĩnh — chạy lại độc lập hôm nay:**

| Phép đo | Kết quả |
|---|---|
| `npm run typecheck` | ✅ sạch |
| `npm run lint` | ✅ `No ESLint warnings or errors` |
| `npm run test:arch` | ✅ **43 đạt · 0 hỏng** |

**Bộ kiểm động — chạy lại độc lập hôm nay, phiên đăng nhập thật:**

| # | Bài kiểm | Kết quả |
|---|---|---|
| 1 | Kiến trúc | ✅ đạt |
| 2 | Toàn vẹn dữ liệu nền | ✅ đạt |
| 3 | Quét `anon` + Buyer | ✅ đạt |
| 4 | Phân quyền người ngoài | ✅ đạt |
| 5 | **Phân quyền người trong** | ⛔ **HỎNG** |
| 6 | Ma trận đọc `VR-004`·`VR-005` | ✅ đạt — `90/90` |
| 7 | Vòng đời chiết tính | ✅ đạt — `6 đạt · 0 hỏng · 2 chưa đo được` |
| 8 | Ma trận ghi `UPDATE` | ✅ đạt — `75/75` |
| 9 | `A001` runtime | ✅ đạt — `23/23` |

⇒ **`npm test` thoát mã `1`.** ⇒ **`npm run verify` — cổng chính trước commit
theo CLAUDE.md §5 — hiện đang ĐỎ.** `[MEASURED]`

> 🔑 Bài `5` hỏng **đúng bằng 6 ngoại lệ có chủ ý** của `TD-25`. Đây là **đỏ có
> chủ ý**, không phải hồi quy. Nhưng nó vẫn là **một cổng đang đỏ**, và §E dựa
> vào sự thật đó chứ không dựa vào lời giải thích của nó.

---

# A · NHỮNG GÌ ĐÃ HOÀN THÀNH

## A.1 Architecture — nền văn bản `[MEASURED]`

| # | Hạng mục | Bằng chứng |
|---|---|---|
| `A-1` | **Architecture Freeze** `MONICA-ONE-BASELINE-2026-08-04` — Board ký 04/08 | [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §1 |
| `A-2` | **Hiến pháp v1.6 ADOPTED** — 45 Điều · 8 Phần · lịch sử tu chính đủ `0.1 → 1.6` | `00-CONSTITUTION.md:6` · `:76-79` |
| `A-3` | **BKB v2.0 ADOPTED** — bậc 0′ có hiệu lực | Baseline §2.1 |
| `A-4` | **14 EDD · 149 `DL` · 29 `BDR` · 5 nguyên tắc thiết kế** | `PROJECT_MEMORY` §5 · §6 |
| `A-5` | **Kiểm toán nhất quán ~2.100 cặp đối chiếu** — 0 xung đột nội bộ; 3 mâu thuẫn với Hiến pháp đã giải bằng ADR-015/016/017 | Baseline §1 |
| `A-6` | **Architecture Change Procedure** ban hành — 4 loại thay đổi `T1`–`T4` | EDD-06 §10 |
| `A-7` | **Kho hồ sơ phản biện** `docs/review/` + khuôn mẫu 4 mục — khép `TD-15` và Cổng B mục `B6` | [`review/README.md`](../review/README.md) |

## A.2 Security · RLS — hai lỗ hổng lớn đã đóng `[MEASURED]`

| # | Hạng mục | Trước | Sau |
|---|---|---|---|
| `A-8` | **`F-1` — sổ kiểm toán bất biến** (`041` đã chạy) | mọi vai nội bộ `UPDATE`/`DELETE`/`TRUNCATE` được `activity_log` | hết cả ba; `INSERT`/`SELECT` giữ ⇒ sổ vẫn ghi được. **BDR-14 thoả** |
| `A-9` | **`F-2` — thu hẹp 22 bảng MD** (`042` đã chạy) | `authenticated_only` **22** bảng · `TRUNCATE` hở **22** · `DELETE` hở **22** | `authenticated_only` **0** · `TRUNCATE` hở **0** · `DELETE` hở **6** |
| `A-10` | **`buyer_denied` · `subcon_denied` nguyên vẹn** — người ngoài không rò | — | `rls-external` ✅ đạt |
| `A-11` | **`A001` chạy lại sau `042` — ĐẠT.** `0/12` view chưa đăng ký · **`0` view cho `anon` đọc** · `0/20` hàm `SECDEF` `anon` gọi được · `0` hàm thiếu `search_path` | — | khép **nghĩa vụ ②** của `SECURITY_DEFINER_REGISTRY` §2.4 |
| `A-12` | **`A001` runtime `23/23`** — đo lại hôm nay: 12/12 view chặn `anon`, 8/8 hàm `SECDEF` chặn `anon`, phép chiếu giá thành `anon` không chạm được, **và vai nội bộ vẫn đọc được** *(không chặn phẳng — quy tắc `K-3`)* | — | ✅ |

## A.3 Permission — phép chiếu theo cột `[MEASURED]`

| # | Hạng mục | Số |
|---|---|---|
| `A-13` | **Ma trận đọc `VR-004`/`VR-005`** — 14 vai × 5 đối tượng, soi cả mức **cột** *(5 cột thương lượng không tồn tại trong phép chiếu)* lẫn mức **dòng** *(`DRAFT` không lộ · `APPROVED` thấy)* | **90 đạt · 0 hỏng** |
| `A-14` | **Ma trận ghi `UPDATE`** — có vai `CHỜ THẤY > 0` trong mọi kịch bản *(quy tắc `K-3`)* | **75 đạt · 0 hỏng** |
| `A-15` | **`v_costing_approved`** — phán quyết Board `VR-005` thi hành được: `ketoan` xem giá đã duyệt, ⛔ không xem Cost Breakdown | đăng ký ở `SECURITY_DEFINER_REGISTRY` §2.4 kèm **3 nghĩa vụ**, cả ba ✅ |

## A.4 Aggregate Immutability Engine — `045` · `045b` · `046` `[MEASURED]`

| # | Hạng mục | Bằng chứng |
|---|---|---|
| `A-16` | **Engine generic, luật nằm ở metadata** — bảng `mos_aggregate_immutability` khai `status_column` · `final_states[]` · `mutable_after_final[]`; Immutable Field Set **suy lúc chạy** ⇒ cột mới tự động được bảo vệ | `045` Mục 2–4 |
| `A-17` | **⛔ Không `SECURITY DEFINER`** — engine giữ `SECURITY INVOKER` + **fail-closed**; `SECURITY_DEFINER_REGISTRY` ⛔ không dài thêm | `045:89` · `046:57` · `046:117` |
| `A-18` | **`B-1` đóng** — `DRAFT→SUBMITTED` · `SUBMITTED→APPROVED` · `APPROVED→SUPERSEDED` đều chạy được | `costing-lifecycle` mục A |
| `A-19` | **`B-3` đóng** — khoản mục của chiết tính **đã duyệt** bị khoá; khoản mục bản **nháp** vẫn sửa được | `costing-lifecycle` mục C |
| `A-20` | **Chặn đủ ba hành động trên bảng con** — `UPDATE` · `INSERT` · `DELETE`. ⛔ Không lặp lại lỗi `TRUNCATE` của `041` | ADR-020 §2.3 · `046` |
| `A-21` | 🔑 **Giả định cascade chuyển `[NO EVIDENCE]` → `[MEASURED]`** — trigger `BEFORE DELETE` trên con **thật sự thấy dòng cha đã biến mất** trong lúc `ON DELETE CASCADE`. Đây là rủi ro lớn nhất của ADR-020 §6 mục 2, và nó **đã được đo, không được lập luận** | `046` Mục 5 tự đo |
| `A-22` | **`AGGREGATE_IMMUTABILITY_MATRIX`** ban hành — **luật chọn cơ chế `T`/`L`/`O`**: phần lớn aggregate chỉ cần RLS; trigger chỉ cần ở dạng `L` *(khoá nội dung nhưng chưa kết thúc)* | [`AGGREGATE_IMMUTABILITY_MATRIX.md`](../architecture/AGGREGATE_IMMUTABILITY_MATRIX.md) §0 |
| `A-23` | **Ranh giới `W.1` được tôn trọng** — trigger giữ **bất biến**, ⛔ không liệt kê phép chuyển; phép chuyển thuộc Workflow Engine | `045b` · ADR-019 Rev 2 |

## A.5 Verification — nguyên tắc thành cơ chế `[MEASURED]`

| # | Hạng mục | Vì sao đáng ghi |
|---|---|---|
| `A-24` | **`P-MEASURE` ban hành ba vế** — đo trước · ghi bối cảnh · kết luận chỉ đúng với trạng thái đã đo | Board Directive 05/08 mục 6 |
| `A-25` | 🔑 **`P-MEASURE` được thi hành bằng CƠ CHẾ, không bằng lời nhắc** — `tests/_lib/harness.mjs` cung cấp `boiCanh()` · `dauVan()` · `ketThuc()`. `boiCanh()` in migration **trong KHO** để đặt cạnh `dauVan()` *(hành vi CSDL thật)* ⇒ **lệch kho/CSDL hiện ra trong một cái liếc** | Baseline §3.0 |
| `A-26` | **Sự cố `043` được ghi công khai, ⛔ không xoá dấu vết** — cả ba bước sai được mổ xẻ trong Baseline §3.0, `PROJECT_MEMORY` §0, `ADR-018-review` §A | Hiến pháp Điều 43.7 |
| `A-27` | **`044` khôi phục nguyên văn policy `042`** — lỗ hổng toàn phần do `043` mở đã đóng | `044` · `md-update-matrix` `75/75` |
| `A-28` | **Bộ kiểm bảo mật từ 2 lên 7 bài** — thêm `md-internal-scope` *(bài phân quyền **nội bộ** đầu tiên của dự án)*, `md-read-matrix`, `md-update-matrix`, `costing-lifecycle`, `a001-runtime` | `tests/security/` |
| `A-29` | **Hồ sơ phản biện hậu kiểm ADR-018** tự khai rõ **không đủ điều kiện độc lập** thay vì để tiêu đề *"Independent Review"* làm hồ sơ trông đầy đủ hơn thực tế | `ADR-018-review.md` §🔴 |
| `A-30` | **ADR-019 Revision 2 tự rút lại một kết luận quá mạnh** của Revision 1 *("Phương án C là duy nhất")* | `ADR-019-architecture-review.md` §1 |

## A.6 Tổng kết phần A

**30 hạng mục hoàn thành.** Phần **chẩn đoán và thi hành kỹ thuật** của nền
bảo mật khép ở mức cao: hai lỗ hổng `[VERIFIED]` đã vá và **đo lại trên CSDL
thật**, một engine bất biến generic đã chạy, và bộ kiểm đã đủ răng để phát hiện
hồi quy.

🔴 **Nhưng phần QUẢN TRỊ thì không** — xem §B.1.

---

# B · NHỮNG GÌ CÒN MỞ

## B.1 🔴 GOVERNANCE GAP — nhóm nghiêm trọng nhất

> Đây ⛔ **không** phải khoản nợ kỹ thuật. Đây là **thủ tục hiến định bị đảo
> ngược**, và nó là lý do chính của kiến nghị ở §E.

### `G-1` 🔴 Năm migration đã chạy dưới ba ADR **chưa được phê duyệt**

`[MEASURED]` — đọc trực tiếp trường **Trạng thái** của từng ADR:

| ADR | Trạng thái trong tệp | Migration đã CHẠY dưới nó |
|---|---|---|
| **ADR-018** | 🔴 *"**MỞ LẠI** 05/08/2026"* — chưa duyệt | `042` · `044` |
| **ADR-019** | ⏳ *"Chờ phản biện độc lập + Board phê duyệt"* · header ghi **"Migration ⛔ CHƯA VIẾT"** | `045` · `045b` |
| **ADR-020** | ⏳ *"Chờ phản biện độc lập + Board phê duyệt"* · header ghi **"`046` ⛔ chưa viết"** · §7 Decision Record: **"⏳ CHƯA QUYẾT"** | `046` |

**Vi phạm:**

| Văn bản | Điều | Nội dung |
|---|---|---|
| **Hiến pháp** | **Điều 4** | ADR phải **duyệt xong** trước SQL |
| **CLAUDE.md** | §3 | *"KHÔNG viết SQL trước khi ADR được phê duyệt. Áp dụng từ migration 030 trở đi, **không ngoại lệ**"* |
| **ADR-011** | §2.2 | Thay đổi RLS · policy · lược đồ · mô hình phân quyền ⇒ **bắt buộc** phản biện độc lập **trước** Board duyệt |
| **EDD-06** | §10 | Architecture Change Procedure — mọi thay đổi sau Freeze phải đi qua |

🔑 **Điểm mấu chốt:** ADR-018 §12 tự ghi *"SECURITY FREEZE 🔴 **GIỮ NGUYÊN** —
Board không cắt `B2`"*, và CHANGELOG:165 tự ghi *"`042` chạy trước hai điều kiện
chính nó ghi ở đầu tệp"*. **Hệ thống đã tự phát hiện vi phạm của mình và ghi lại
trung thực — nhưng chưa ai đóng nó.** Bốn migration nữa đã chạy tiếp sau ghi
chú đó.

### `G-2` 🔴 SECURITY FREEZE chưa được cắt — Cổng B mục `B2`

`[MEASURED]`. `MOS §XI.1` còn hiệu lực. `KD-10` — vòng khoá `031d`–`031g` bị
chặn bởi lý do *"bảng còn 0 dòng"* — **chưa được Board cắt**. Baseline §3.1 viết
nguyên văn: *"⛔ Không cắt thì ⛔ không migration nào chạy được."*

Năm migration đã chạy.

### `G-3` 🔴 ⛔ KHÔNG có một phản biện độc lập nào tồn tại

`[MEASURED]`:

| Hạng mục | Hồ sơ | Người phản biện |
|---|---|---|
| ADR-018 | `ADR-018-review.md` | 🔴 **"KHÔNG CÓ"** — tự phản biện, tệp tự khai |
| ADR-019 | `ADR-019-architecture-review.md` | ⏳ **"chưa có"** — tệp tự khai |
| **ADR-020** | ⛔ **⛔ KHÔNG CÓ TỆP NÀO** | — |

ADR-011 §1.3 chỉ định **ChatGPT**; §1.2 nêu lý do: *"Một tác nhân tự tuyên bố
mình thắng trong tranh chấp thẩm quyền của chính mình là xung đột lợi ích, **bất
kể lập luận có hợp lý đến đâu**."*

**ADR-020 nặng nhất trong ba** — nó là ADR **duy nhất** không có cả tự phản
biện, trong khi nó mở rộng bề mặt trigger sang **bảng con của mọi aggregate**.

### `G-4` Cổng B — 4/6 mục còn mở

| Mục | Nội dung | Ai | Trạng thái |
|---|---|---|---|
| `B1` | `VR-001` đo bằng phiên thật | CSA | ✅ **XONG** |
| `B2` | 🔴 **Cắt vòng khoá SECURITY FREEZE** | **Board** | 🔴 **MỞ** |
| `B3` | Gộp ba chuỗi ADR + cấp lại số cho một `ADR-001` | CSA | 🟡 **MỞ** *(không chặn mã)* |
| `B4` | Người thứ hai cho `SOD-H04`·`H05`·`H06` | Joseph | 🔴 **MỞ** |
| `B5` | **Thời hạn phản biện tối đa** | Board | 🔴 **MỞ** |
| `B6` | Kho hồ sơ phản biện | CSA | ✅ **XONG** |

> 🔑 `B5` và `G-3` khoá lẫn nhau: chưa có thời hạn thì một người phản biện im
> lặng **chặn vô thời hạn**; nhưng bỏ qua phản biện thì `G-1` lặp lại. **Board
> phải cắt nút này, ⛔ không phải CSA.**

### `G-5` Sổ hồ sơ phản biện trống trong khi hồ sơ đã tồn tại

`docs/review/README.md` — bảng *"Sổ hồ sơ"* ghi **"(chưa có)"**, trong khi thư
mục đã có **2 hồ sơ**. Quy tắc `R-1` của chính tệp đó không được thi hành.

---

## B.2 🔴 DOCUMENTATION GAP — sáu tài liệu chuẩn tắc lệch khỏi hiện thực

> 🔑 **Đây ⛔ không phải lỗi chính tả.** `PROJECT_MEMORY` là **cửa vào duy nhất**
> cho mọi AI và lập trình viên *(Baseline §3.3 bước ①)*. Nó sai ⇒ **mọi phiên
> làm việc mới khởi động bằng tiền đề sai** — đúng sự cố mà ADR-010 đã phải sửa
> một lần rồi.

| # | Tài liệu | Lệch gì | Mức |
|---|---|---|---|
| `D-1` | **`PROJECT_MEMORY.md`** §2.3 | ghi *"ADR — **11 bản**"*, liệt kê 15 dòng, **thiếu hẳn ADR-018 · 019 · 020** | 🔴 |
| `D-2` | **`PROJECT_MEMORY.md`** §8 `KD-2` | ghi *"🔴 **`VR-001` chưa chạy**"* — **mâu thuẫn** Baseline §3.1 `B1` ✅ và [`VR-001-KET-QUA.md`](VR-001-KET-QUA.md) đã có kết quả | 🔴 |
| `D-3` | **`PROJECT_MEMORY.md`** §9 mục 1 | ghi `VR-001` *"🔴 chặn Implementation"* — cùng mâu thuẫn trên | 🔴 |
| `D-4` | **`PROJECT_MEMORY.md`** §12 | 13 EDD *(Baseline: **14**)* · ~208 màn hình *(Baseline: **~226**)* · 9 mục còn mở *(Baseline: **11**)* | 🟠 |
| `D-5` | **`PROJECT_MEMORY.md`** §11.1 | nhật ký phiên bản dừng ở `1.0 · 2026-08-04`, chưa ghi lần cập nhật nào sau đó — trong khi tệp **đã bị sửa** ngày 05/08 | 🟠 |
| `D-6` | **`PROJECT_MEMORY.md`** §2.4 | ghi `TECHNICAL_DEBT` = *"TD-01…TD-15"*; tệp thật chỉ có `TD-01…TD-13` | 🟡 |
| `D-7` | **`ARCHITECTURE_BASELINE.md`** | ⛔ **0 lần nhắc** ADR-019 · ADR-020 · `044` · `045` · `045b` · `046`. §2.1 và §6 còn ghi *"ADR **15 tài liệu · 14 số hiệu**"*; kho thật có **18 tài liệu · 17 số hiệu** | 🔴 |
| `D-8` | **`docs/adr/README.md`** | mục lục thiếu **ADR-019 · ADR-020**; dòng ADR-018 còn ghi migration *"`042` **(chưa viết)**"* trong khi `042` đã chạy | 🔴 |
| `D-9` | **`MIGRATION_INDEX.md`** | dừng ở 02/08. ⛔ **Không có dòng nào** cho `040` `041` `042` `044` `045` `045b` `046`. Quy tắc §6.1 của chính tệp đó bị vi phạm | 🔴 |
| `D-10` | **`RLS_COVERAGE_MATRIX.md`** | nhật ký dừng ở `042`. ⛔ Không ghi `044` *(migration policy)*, `045`/`046` *(tầng trigger — nay là một phần của bề mặt bảo vệ ghi)*. CLAUDE.md §3 bắt buộc cập nhật sau **mỗi** migration chạm RLS | 🔴 |
| `D-11` | **`CHANGELOG.md`** | dừng ở `042`. ⛔ Không có mục nào cho sự cố `043`, `044`, `045`, `045b`, `046`, ADR-019, ADR-020. Board Directive 04/08 mục 6 bắt buộc mỗi Sprint bàn giao đủ *Changelog · Decision Log* | 🔴 |
| `D-12` | **`TECHNICAL_DEBT.md`** | tự khai `TD-30` *"SỔ NÀY KHÔNG CÒN ĐẦY ĐỦ"* — nợ vỡ thành **5 nơi cấp số**; `TD-25`…`TD-33` sống trong ADR, ⛔ không có trong sổ. `TD-13` mang **hai nghĩa** | 🔴 |
| `D-13` | **`CLAUDE.md`** | bảng thứ bậc bậc 1 ghi Hiến pháp **`v1.5 ADOPTED`**, trong khi khối Freeze cùng tệp ghi **v1.6** và `00-CONSTITUTION.md:6` ghi **1.6**. **Mâu thuẫn nội tại trong tệp khởi động của mọi phiên** | 🔴 |
| `D-14` | **`CLAUDE.md`** §2.2 | trích *"SECURITY FREEZE (**Hiến pháp** XI.1)"* — điều đó nằm ở `MONICA_CONSTITUTION.md` **bậc 4**. Trái quy tắc trích dẫn của chính CLAUDE.md §0 ⇒ `TD-28` | 🟠 |
| `D-15` | **`SPRINT_2_PLAN.md`** 4.1 | đề xuất soạn **"ADR-014"** — số **dành riêng, ⛔ không tái sử dụng** *(Hiến pháp §37.5)* | 🟠 |
| `D-16` | **`BUSINESS_KNOWLEDGE_BASE.md:463`** | bậc 0′ **ADOPTED** còn chứa phát biểu `VR-001` **đã bị bác bỏ**; mới gắn đính chính tại chỗ ⇒ `TD-29` | 🟠 |

---

## B.3 🔴 MIGRATION GAP

| # | Nội dung | Mức |
|---|---|---|
| `M-1` | 🔴 **Số hiệu `043` đã tiêu thụ trên CSDL thật rồi bị thu hồi — và ⛔ KHÔNG có dòng nào trong `MIGRATION_INDEX`.** Sự cố được kể chi tiết ở 4 tài liệu khác, nhưng **sổ đăng ký số hiệu — nơi duy nhất người sau sẽ tra — thì trống**. Quy tắc §6.3 của chính tệp đó: *"Số hiệu bị bỏ → ghi `⚪ skipped` kèm lý do. Khoảng trống không có lý do là một khoản nợ tài liệu"* | 🔴 |
| `M-2` | `031d`–`031g` **reserved · blocked** bởi `G4` *(bảng còn 0 dòng)*; freeze giữ tới khi `031a→031g` xong ⇒ `KD-10` vòng khoá chưa cắt | 🔴 |
| `M-3` | `032` · `033` · `039` **reserved · planned**, chưa viết | 🟡 |
| `M-4` | ⛔ **Không migration nào trả `TD-25`** — 6 bảng còn quyền `DELETE`. Cần thêm cột `deleted_at` cho `costing_items` ⇒ **đổi lược đồ ⇒ ADR riêng** | 🔴 |
| `M-5` | 🔴 **Engine bất biến mới phủ 2/88 aggregate** — `costings` *(root)* + `costing_items` *(con)*. Ma trận đo được **24/88 có vòng đời** và **≥17 có bảng con**. Engine đúng nhưng **chưa ai khai báo phần còn lại** | 🔴 |
| `M-6` | `TD-33` — **con của con (cháu)** ⛔ không được phủ. `orders → cut_tickets → cut_bundles` là chuỗi ba tầng có thật; `046` chỉ **một tầng** | 🟠 |

---

## B.4 🟠 VERIFICATION GAP

| # | Nội dung | Mức |
|---|---|---|
| `V-1` | 🔴 **`npm run verify` ĐỎ** — `md-internal-scope` hỏng 6 mục. Đỏ **có chủ ý** *(= 6 ngoại lệ `TD-25`)*, nhưng CLAUDE.md §5 bước 1 đòi *"`npm run verify` **sạch**"* trước commit. Hoặc trả `TD-25`, hoặc Board ra quyết định miễn trừ **có thời hạn** — ⛔ không để cổng đỏ vô thời hạn | 🔴 |
| `V-2` | **2 mục `⚪ chưa đo được`** trong `costing-lifecycle`: `SUPERSEDED → DRAFT` *(thuộc Workflow Engine)* và *"nội dung `SUPERSEDED` sửa được"* *(hệ quả Board Decision `A1`)*. Đúng quy tắc `V.1` — nhưng **vẫn là chưa đo** | 🟠 |
| `V-3` | 🔴 **Engine chưa được kiểm trên aggregate thứ hai.** Toàn bộ bằng chứng đến từ `costings`/`costing_items`. Tính **generic** — luận điểm trung tâm của ADR-019/020 — là `[INFERRED]`, ⛔ không phải `[MEASURED]` | 🔴 |
| `V-4` | 🔴 **MD ⛔ không có một bài kiểm nghiệp vụ nào** — 19.058 dòng mã. `KD-11` · `TD-22`. **Đây đúng là điều kiện ra của Sprint I-2** | 🔴 |
| `V-5` | 🔴 **`TD-03` — ⛔ không có phép kiểm "vốn từ trong mã ⟷ vốn từ trong CSDL"**. Đây là thứ đã để **8 bộ từ vựng trạng thái** sống sót qua 33 migration mà không ai thấy *(`KD-9`·`TD-24`)*. Sprint 2 Plan gọi nó là *"hạng mục có đòn bẩy cao nhất toàn Sprint"* | 🔴 |
| `V-6` | **`TD-27`** — luật `.delete()` của arch test dùng **ngưỡng bằng hiện trạng** (`arch.test.mjs:66`) ⇒ ⛔ không chặn lời gọi mới, chỉ chặn lời gọi **thứ 5** trở đi. Lưới an toàn có lỗ đúng ở chỗ nó tự nhận là kín | 🟠 |
| `V-7` | 🔴 **Cổng D chưa dựng gì** — bộ kiểm phép chiếu · rò **chéo tenant** · rò **chéo đối tác** · **tấn công tương quan** (`SP-4`) · vốn-từ-từ-trạng-thái · cấm màn hình tự tính · `duplicate_field_count = 0` · **neo băm Audit Log ra ngoài** *(`KL-3`: ⛔ không có giải pháp TRONG CSDL chống được quản trị viên CSDL)* | 🔴 |
| `V-8` | **Bài kiểm hiệu năng RLS là phép ĐO, ⛔ không phải phép KIỂM** — `npm run bench` luôn thoát `0`. Chi phí trigger của `045`/`046` **chưa đo** | 🟡 |

---

## B.5 🟠 ARCHITECTURE GAP · BUG · TECHNICAL DEBT còn tồn tại

### Lỗi đã đo, chưa sửa `[MEASURED]` — xác nhận lại hôm nay

| # | Lỗi | Nơi | Mức |
|---|---|---|---|
| `KD-3`·`TD-17` | 🔴 **`late_milestones: 0` viết cứng** ⇒ hai màn hình cùng một PO cho **hai mức khẩn cấp khác nhau**. `po.service.ts:114` tính thật; `po-twin` trả `0` | `po-twin.service.ts:132` | 🔴 |
| `TD-01` | 🔴 **`saveSizeBreakdown` bù trừ thay cho giao dịch** — cửa sổ mất dữ liệu chưa đóng | `po.actions.ts:127` | 🔴 |
| `KD-4`·`TD-18` | **`md-client.tsx` 886/900 dòng** — còn **14 dòng** là gãy arch test | | 🟠 |
| `KD-5`·`TD-19` | **`md-legacy-client.tsx` 437 dòng mã chết** — nơi **DUY NHẤT** gọi `garment-math` | | 🟠 |
| `TD-25` | **4 lời gọi `.delete()` còn sống** — `collaboration.actions.ts:60` · `commercial.actions.ts:270` · `po.actions.ts:161` · `style.actions.ts:211` | | 🔴 |

### Khoảng trống kiến trúc

| # | Nội dung | Mức |
|---|---|---|
| `TD-26` | 🔴 **Phân quyền nội bộ theo VAI, chưa theo ASSIGNMENT.** Playbook **Điều XXX** — *ƯU TIÊN TỐI CAO* — vẫn **chưa thi hành cho nội bộ**. Chuỗi `Identity → Assignment → Resource Scope → Permission → Action` hiện rút gọn còn `Identity → Role → Action` | 🔴 |
| `TD-32` | 🟠 **Vi phạm SoD bị đóng băng vào tầng CSDL** — `md` **tự duyệt chiết tính của chính mình**; `giamdoc` ⛔ không có `/md` trong `MODULE_ACCESS`. Trái Board Working Principle v2.0 | 🟠 |
| `TD-31` | **Data Egress Control chưa dựng** — `VR-004` cấm *"export, copy"* nhưng `042` chỉ thi hành được *"chỉ đọc"*. Watermark · nhật ký tải · audit trail nằm ở Cổng D | 🟠 |
| — | **Rule Engine chưa tồn tại trên CSDL** — EDD-04 định nghĩa mô hình, ⛔ chưa migration nào dựng. `[NO EVIDENCE]` về xung đột | 🟡 |
| — | **Workflow Engine chưa tồn tại** — `W.1` giao phép chuyển cho nó; hiện ⛔ không có gì cầm phép chuyển. `SUPERSEDED → DRAFT` vì thế `⚪ chưa đo được` | 🟠 |
| `KD-6`·`TD-20` | **`/subcon` phục vụ 7 vai trò** gồm cả nhà thầu ngoài | 🔴 |
| `TD-05` | **Trang chủ hiện đủ 16 thẻ cho mọi người** — Hiến pháp §13.5 *(lọc theo quyền)* nay là **điều kiện thi hành** sau ADR-017 | 🟠 |
| — | **16 thẻ / đích 19 Business App** — `KD-7`; bottom nav `KD-8` | 🟡 |

### Rủi ro tồn đọng có tên

| # | Nội dung |
|---|---|
| `KL-3` | 🔴 ⛔ **Không có giải pháp TRONG CSDL chống được quản trị viên CSDL** — neo băm ra ngoài **bắt buộc**, chưa làm |
| — | **3 vai còn cấp quyền mặc định cho `anon`** *(`supabase_admin` tạo bảng·hàm·sequence)* — tồn đọng có sẵn, ta ⛔ không đủ quyền đổi. Đối tượng do `postgres` tạo đều sạch |
| `KL-8` | Nếu xưởng dùng chung tài khoản, `BDR-23` chỉ tạo **ảo giác bằng chứng** — **chưa đo** |

---

# C · BẮT BUỘC PHẢI SỬA TRƯỚC IMPLEMENTATION

> Tiêu chí chọn: **hoặc** nó làm hồ sơ quản trị vô hiệu, **hoặc** người sau sẽ
> khởi động bằng tiền đề sai, **hoặc** nó là cổng đang đỏ. ⛔ Không đưa vào đây
> thứ chỉ *"nên làm"*.

| # | Việc | Ai | Vì sao ⛔ không hoãn được |
|---|---|---|---|
| **`C-1`** | 🔴 **Board phán quyết ba ADR-018 · 019 · 020** — duyệt, duyệt-có-điều-kiện, hoặc bác **kèm lệnh quay lui trên CSDL thật** | **Board** | Năm migration đang chạy sản xuất dưới ba ADR chưa duyệt. **Hồ sơ hiện tại ⛔ không chứng minh được vì sao CSDL đang ở trạng thái này.** Hiến pháp Điều 4 |
| **`C-2`** | 🔴 **Phản biện độc lập cho ADR-020** *(tối thiểu — hai ADR kia đã có tự phản biện có chất lượng)* | **ChatGPT** · ADR-011 §1.3 | ADR-020 là ADR **duy nhất ⛔ không có hồ sơ nào**, và nó mở trigger sang bảng con của **mọi** aggregate |
| **`C-3`** | 🔴 **Cắt hoặc gia hạn SECURITY FREEZE bằng văn bản** — Cổng B `B2` | **Board** | Freeze đang **có hiệu lực trên giấy** và **bị vượt trên thực tế**. Một luật không ai tuân mà không ai gỡ sẽ làm mọi luật còn lại mất trọng lượng |
| **`C-4`** | 🔴 **Định thời hạn phản biện tối đa** — Cổng B `B5` | **Board** | ⛔ Không có nó thì `C-2` có thể chặn vô thời hạn, và cám dỗ *"cứ chạy rồi hậu kiểm"* sẽ lặp lại — nó **đã** lặp lại 5 lần |
| **`C-5`** | 🔴 **Đồng bộ `PROJECT_MEMORY` với nguồn** — `D-1`…`D-6`. Quy tắc `PM-4` của chính nó: *"Mâu thuẫn với nguồn ⇒ **sửa Project Memory**"* | CSA | Nó là **cửa vào duy nhất** *(Baseline §3.3 bước ①)*. Sai ⇒ mọi phiên mới bắt đầu từ tiền đề sai — **đúng sự cố ADR-010 đã phải sửa một lần** |
| **`C-6`** | 🔴 **Cập nhật `ARCHITECTURE_BASELINE`** — ghi ADR-019·020 và `044`…`046` vào §3.1/§6, sửa số ADR `15/14` → `18/17` | CSA | Baseline là tệp Board đã **ký**. Nó ⛔ không mô tả hệ thống hiện tại |
| **`C-7`** | 🔴 **Ghi `043` vào `MIGRATION_INDEX`** kèm lý do thu hồi + `040`…`046` | CSA | `M-1`. Số hiệu **đã tiêu thụ trên CSDL sản xuất** mà sổ đăng ký trống — người sau sẽ cấp lại `043` |
| **`C-8`** | 🔴 **Cập nhật `RLS_COVERAGE_MATRIX`** cho `044`·`045`·`046` | CSA | CLAUDE.md §3 bắt buộc. Tầng trigger nay là **một phần bề mặt bảo vệ ghi** — ma trận không có nó là ma trận **sai** |
| **`C-9`** | 🔴 **Cập nhật `CHANGELOG` + mục lục ADR** *(`D-8` · `D-11`)* | CSA | Board Directive 04/08 mục 6 |
| **`C-10`** | 🔴 **Sửa mâu thuẫn v1.5/v1.6 trong `CLAUDE.md`** | CSA | `D-13`. Tệp khởi động của mọi phiên đang tự mâu thuẫn về **văn bản bậc 1** |
| **`C-11`** | 🔴 **Gộp sổ nợ về một nơi cấp số** — `TD-30` | CSA + Board | 5 nơi cấp số, `TD-13` mang hai nghĩa. **Đã va chạm số hiệu 3 lần**; lần thứ tư chỉ là vấn đề thời gian |
| **`C-12`** | 🔴 **Đưa `npm run verify` về xanh** — trả `TD-25`, **hoặc** Board ra miễn trừ **có thời hạn** ghi vào bài kiểm | Board quyết · CSA làm | `V-1`. Một cổng đỏ vô thời hạn sẽ dạy cả đội đọc lướt qua màu đỏ — và đó là cách `F-1` sống sót 20 migration |

> 🔑 **`C-5` → `C-11` là bảy việc tài liệu, ⛔ không cần Board, ⛔ không cần
> migration, ⛔ không chạm mã.** Chúng làm được **ngay hôm nay**. Chỉ `C-1`…`C-4`
> và `C-12` cần phán quyết.

---

# D · CÓ THỂ CHUYỂN SANG TECHNICAL DEBT

> Tiêu chí: có **chủ sở hữu**, có **Sprint đích**, và ⛔ **không** làm hồ sơ hiện
> tại sai sự thật.

| # | Khoản | Sprint đích | Vì sao hoãn được |
|---|---|---|---|
| `TD-17` | `late_milestones` viết cứng | **I-2** | Lỗi đã đo, đã khoanh vùng, sửa **được phép trong freeze**. ⛔ Không lan |
| `TD-18` | Tách `md-client.tsx` | **I-2** | Còn 14 dòng đệm; arch test canh tự động |
| `TD-19` | Nối lại `md-legacy-client` trước khi xoá | **I-6** | ⚠️ ⛔ **Không xoá trước khi nối** — nơi duy nhất gọi `garment-math` |
| `TD-01` | `saveSizeBreakdown` → RPC một giao dịch | **I-2/I-3** | Bản vá bù trừ **có tác dụng**; cửa sổ hẹp, ⛔ chưa hiện thực hoá |
| `TD-25` | Thu hồi nốt `DELETE` 6 bảng | **I-2** | ⚠️ **Chỉ hoãn được nếu `C-12` chọn đường miễn trừ có thời hạn** |
| `TD-26` | Phân quyền nội bộ theo Assignment | **I-3** | Cần Assignment Domain chạy trước. ⛔ Không phải lỗ hổng — là **mô hình chưa đủ sâu** |
| `TD-27` | `.delete()` → danh sách miễn trừ theo `tệp:dòng` | **I-2** | Đi cùng `TD-25` |
| `TD-28` | Sửa trích dẫn `MOS §XI.1` trong CLAUDE.md | **I-2** | Gộp vào `C-10` cho rẻ |
| `TD-29` | Viết lại `BKB:463` | bản BKB kế | Đã gắn đính chính **tại chỗ** ⇒ ⛔ không ai đọc nhầm |
| `TD-31` | Data Egress Control | **Cổng D** | Đã ghi thành **giới hạn có tên**, ⛔ không phải lỗ hổng im lặng |
| `TD-32` | SoD người lập ≠ người duyệt | **I-3** ⚠️ | ⛔ **Không phải hồi quy do `042`** — trước đó **tệ hơn**. Nhưng phải có ADR riêng **trước** khi có dữ liệu thật |
| `TD-33` | Bất biến **ba tầng** *(cháu)* | **I-4** | `cut_bundles` chưa có vòng đời chạy. Trả **trước** khi Cut Domain hoạt động |
| `M-3` | `032`·`033`·`039` | theo `031` | Reserved có lý do ghi rõ |
| `M-5` | Khai báo engine cho 22 aggregate còn lại | **I-4** | ⚠️ Chỉ hoãn được **nếu** `V-3` được trả trước — xem cảnh báo dưới |
| `TD-02`·`TD-04`·`TD-05`·`TD-06`·`TD-07`·`TD-09`·`TD-10`·`TD-11`·`TD-12`·`TD-13` | Design System · i18n · điều hướng | I-2…I-6 | Có cơ chế **bánh cóc** canh không phình *(arch test ⑨⑩)* |

### 🔴 Hai khoản ⛔ KHÔNG chuyển được sang Technical Debt

| # | Vì sao ⛔ không |
|---|---|
| **`V-3`** *(engine chưa kiểm trên aggregate thứ hai)* | Tính **generic** là **luận điểm trung tâm** của ADR-019 §4 và ADR-020 §4 — nó là lý do Board **bác** phương án *"trigger riêng cho `costing_items`"*. Nếu generic sai, ⛔ không phải hoãn một khoản nợ mà là **quyết định kiến trúc đã sai**. Phải đo **một** aggregate thứ hai *(dạng `L`, có bảng con)* **trước** khi Board duyệt ADR-020 |
| **`V-4`** *(MD ⛔ không có bài kiểm nghiệp vụ)* | Nó **chính là điều kiện ra** của Sprint I-2 *(Baseline §3.2)*. Chuyển nó thành nợ là **xoá điều kiện ra của Sprint đang định khởi động** |

---

# E · KIẾN NGHỊ

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                  🔴  F O U N D A T I O N   N O T   C O M P L E T E       ║
║                                                                          ║
║   Nền KỸ THUẬT: mạnh — 30 hạng mục xong, 8/9 bài kiểm xanh,              ║
║                 hai lỗ hổng đã vá và ĐO LẠI trên CSDL thật.             ║
║                                                                          ║
║   Nền QUẢN TRỊ: 🔴 CHƯA ĐÓNG ĐƯỢC.                                       ║
║                                                                          ║
║   5 migration đang chạy sản xuất dưới 3 ADR chưa phê duyệt,             ║
║   0 phản biện độc lập, SECURITY FREEZE chưa cắt,                        ║
║   và 6 tài liệu chuẩn tắc — gồm cả Baseline Board đã ký —               ║
║   ⛔ KHÔNG mô tả hệ thống hiện tại.                                      ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## E.1 Vì sao ⛔ không phát hành ba chứng nhận

Mục 4 của chỉ thị nói: *"Nếu Foundation Complete: phát hành Foundation
Completion Certificate · Sprint I Completion Report · Implementation Readiness
Report."* **Điều kiện ⛔ không thoả**, nên tôi ⛔ không phát hành.

Và tôi muốn nói thẳng vì sao — vì cám dỗ ở đây rất cụ thể:

> **Ba chứng nhận đó sẽ trông rất tốt.** 30 hạng mục xong, 8/9 bài xanh, hai lỗ
> hổng đã vá, một engine generic đã chạy, `A001` sạch, `90/90` và `75/75`. Viết
> ra thì hồ sơ **đẹp**.
>
> Nhưng một Completion Certificate ký trong lúc **5 migration đang chạy dưới 3
> ADR chưa duyệt** là đúng thứ mà `AC-1` cấm: **hồ sơ chạy được, khuyết tật sống
> dưới một lớp giấy.** Và nó sẽ nổi lên ở đúng chỗ khó nhất — lúc ai đó hỏi *"vì
> sao CSDL đang ở trạng thái này"*, sáu tháng nữa, khi hội thoại này đã biến mất.

## E.2 Nghịch lý phải nói rõ

`042`, `044`, `045`, `045b`, `046` **đều đúng về kỹ thuật** — mỗi cái đều có
phép đo đứng sau, và chúng đã **thu hẹp** bề mặt tấn công một cách đo được. Nếu
Board bác chúng, hệ thống sẽ **kém an toàn hơn** hôm nay.

⇒ **Kiến nghị `NOT COMPLETE` ⛔ không phải để quay lui.** Nó là để **phê chuẩn
những gì đã chạy**, đóng hồ sơ, rồi mới đi tiếp — chứ ⛔ không phải đi tiếp bằng
cách coi hồ sơ là xong.

## E.3 Trình tự đề nghị

```
BƯỚC 1 — CSA làm ngay, ⛔ không chờ ai        (7 việc tài liệu · ~1 buổi)
   C-5  C-6  C-7  C-8  C-9  C-10  C-11
   ⇒ Hồ sơ mô tả đúng hệ thống hiện tại. Board phán quyết trên SỰ THẬT.

BƯỚC 2 — Đo một aggregate thứ hai              (V-3 · ⛔ KHÔNG hoãn được)
   Chọn 1 aggregate dạng `L` có bảng con, khai báo bằng metadata,
   chạy phép đo. ⛔ Không sửa engine — nếu phải sửa, generic đã sai.

BƯỚC 3 — Phản biện độc lập ADR-020             (C-2 · ChatGPT)

BƯỚC 4 — 🔴 BOARD PHÁN QUYẾT                   (C-1 C-3 C-4 C-12)
   ① ADR-018 · 019 · 020 — duyệt / duyệt-có-điều-kiện / bác + lệnh quay lui
   ② SECURITY FREEZE — cắt hay gia hạn, bằng văn bản
   ③ Thời hạn phản biện tối đa
   ④ TD-25 — trả ngay, hay miễn trừ CÓ THỜI HẠN

BƯỚC 5 — Phát hành 3 chứng nhận                (khi và chỉ khi 1–4 xong)

BƯỚC 6 — 🔴 KHỞI ĐỘNG SPRINT I-2
```

## E.4 Điều kiện ra của Foundation — dùng làm cổng kiểm

| # | Điều kiện | Hôm nay |
|---|---|---|
| `F-a` | ⛔ Không migration nào chạy dưới ADR chưa duyệt | 🔴 **5 cái** |
| `F-b` | Mọi hạng mục ADR-011 §2.2 có hồ sơ phản biện | 🔴 **0/3 độc lập · 2/3 tự phản biện · ADR-020 không có gì** |
| `F-c` | SECURITY FREEZE có trạng thái rõ ràng bằng văn bản | 🔴 **mở trên giấy, bị vượt trên thực tế** |
| `F-d` | `PROJECT_MEMORY` ⟷ nguồn: 0 mâu thuẫn | 🔴 **≥6** |
| `F-e` | `ARCHITECTURE_BASELINE` mô tả đúng hệ thống | 🔴 **thiếu 2 ADR · 4 migration** |
| `F-f` | `MIGRATION_INDEX` ⛔ không khoảng trống vô lý do | 🔴 **`043` + 7 dòng thiếu** |
| `F-g` | `RLS_COVERAGE_MATRIX` cập nhật tới migration mới nhất | 🔴 **dừng ở `042`** |
| `F-h` | `npm run verify` xanh **hoặc** có miễn trừ ghi rõ + thời hạn | 🔴 **đỏ, ⛔ không thời hạn** |
| `F-i` | Cổng B đóng | 🟠 **2/6 xong** |
| `F-j` | Luận điểm generic của engine `[MEASURED]` | 🔴 **`[INFERRED]`** |

**0/10.** Chín trong mười là **việc tài liệu và phán quyết** — ⛔ không có cái
nào cần viết lại kiến trúc.

---

## §F · CHỖ TÔI CÓ THỂ SAI — ADR-011 §2.3 mục 4

1. **Tôi là người soạn ADR-018·019·020 và là người viết `042`…`046`.** Bản audit
   này vì thế **⛔ không độc lập** — cùng khuyết tật mà `ADR-018-review.md` đã tự
   khai. Một người phản biện thật có thể thấy §A của tôi **rộng lượng với chính
   mình** và §B **chưa đủ nặng**.
2. **Tôi ⛔ không đọc trực tiếp `pg_policies`** trong đợt này. Kết luận về trạng
   thái CSDL đến từ **bộ kiểm chạy hôm nay** *(hành vi thật, phiên thật)* và từ
   **tài liệu**. Hành vi đúng ⛔ không chứng minh biểu thức policy đúng — đó
   chính là bài học `043`.
3. **Danh sách khuyết tật ⛔ có thể chưa đủ.** Tôi rà theo tài liệu; khuyết tật
   ⛔ không được ghi ở đâu thì audit này ⛔ không thấy. `TD-30` *(sổ nợ vỡ 5
   nơi)* làm rủi ro này **cao hơn bình thường**.
4. **Mức độ của `C-12` là phán đoán của tôi, ⛔ không phải phép đo.** Board có
   thể hợp lý coi *"đỏ có chủ ý, có nhãn `TD-25`"* là chấp nhận được. Tôi xếp nó
   vào §C vì **cổng đỏ vô thời hạn** làm hỏng thói quen đọc bài kiểm — nhưng đó
   là lập luận về **con người**, ⛔ không phải về **hệ thống**.
5. **Tôi ⛔ không đo hiệu năng** của trigger `045`/`046`. `V-8` ghi nó là khoảng
   trống; nếu chi phí lớn, kết luận *"engine sẵn sàng nhân rộng"* của §A.4 sẽ
   phải xét lại.

---

## §G · THAM CHIẾU

- [`ARCHITECTURE_BASELINE.md`](../ARCHITECTURE_BASELINE.md) §3.1 Cổng B · §3.2 lộ trình Sprint
- [`PROJECT_MEMORY.md`](../PROJECT_MEMORY.md) §8 khuyết tật · §9 mục còn mở
- [ADR-018](../adr/ADR-018-thu-hep-authenticated-only.md) · [ADR-019](../adr/ADR-019-vong-doi-chiet-tinh.md) · [ADR-020](../adr/ADR-020-aggregate-child-immutability.md)
- [`review/ADR-018-review.md`](../review/ADR-018-review.md) · [`review/ADR-019-architecture-review.md`](../review/ADR-019-architecture-review.md)
- [`AGGREGATE_IMMUTABILITY_MATRIX.md`](../architecture/AGGREGATE_IMMUTABILITY_MATRIX.md)
- [`VR-001-KET-QUA.md`](VR-001-KET-QUA.md) · [`RLS_COVERAGE_MATRIX.md`](../RLS_COVERAGE_MATRIX.md) · [`SECURITY_DEFINER_REGISTRY.md`](../SECURITY_DEFINER_REGISTRY.md)
- [`MIGRATION_INDEX.md`](../MIGRATION_INDEX.md) · [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) · [`CHANGELOG.md`](../../CHANGELOG.md)
- [EDD-06 §10](../enterprise-design/EDD-06-ARCHITECTURE-FREEZE-PACKAGE.md) Architecture Change Procedure
- `supabase/migrations/041` · `042` · `044` · `045` · `045b` · `046`
- `tests/` — 9 bài · `tests/_lib/harness.mjs` *(cơ chế `P-MEASURE`)*

---

> **Trạng thái hồ sơ:** ⏳ **trình Board.** ⛔ Không phát hành chứng nhận nào.
> ⛔ Không khởi động Sprint I-2 cho tới khi Board xác nhận Foundation Complete.
