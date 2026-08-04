# KIỂM TOÁN MÔI TRƯỜNG PHÁT TRIỂN CLAUDE CODE

> **Phạm vi:** CHỈ môi trường phát triển Claude Code trên máy trạm.
> **Ngoài phạm vi:** mã nguồn Monica ONE · cơ sở dữ liệu · Hiến pháp · BKB · kiến trúc.
> Không một tệp nào thuộc các nhóm trên bị đọc-để-sửa hay bị sửa trong đợt kiểm toán này.

| | |
|---|---|
| **Mã tài liệu** | `CLAUDE_ENVIRONMENT_AUDIT` |
| **Phiên bản** | **1.1** — sửa đổi sau thao tác khắc phục 14:31, xem [Phụ lục A](#phụ-lục-a--thao-tác-khắc-phục-1431-và-kết-quả-thực-tế) |
| **Ngày thực hiện** | 04/08/2026 (giờ VN, UTC+7) |
| **Máy trạm** | Windows 11 Home · Build 26200 · 10.0.26200 |
| **Người dùng** | `JOSEP` (không phải Administrator) |
| **Căn cứ** | Board Directive — *Enterprise Environment Health Check v1.0* |
| **Nguyên tắc** | Bằng chứng trước · Kết luận sau · Không suy đoán |
| **Trạng thái** | ⚠️ Hoàn tất kiểm toán · **đã thực hiện khắc phục P-02 và khắc phục đó KHÔNG đạt kỳ vọng** — xem Phụ lục A |

> ## ⚠️ ĐÍNH CHÍNH BẮT BUỘC ĐỌC TRƯỚC
>
> Bản **1.0** kết luận rằng thư mục rác `.claude-code-gEDMabDG` chỉ chứa "một nhị
> phân đã lỗi thời, không có dữ liệu người dùng", và bản 2.1.221 **hoàn chỉnh và
> độc lập** với nó. **Kết luận đó SAI.**
>
> Khi thực thi khắc phục lúc 14:31, thư mục rác **không bị xoá** mà **được khôi
> phục ngược** vào đúng vị trí gói `claude-code-win32-x64`, **ghi đè lên nhị phân
> 2.1.221**. Bản cài hiện **không nhất quán nội bộ**: `package.json` khai báo
> 2.1.221 nhưng `claude.exe` trong cùng thư mục là **2.1.220**.
>
> Điểm sức khoẻ hạ từ **92 → 84 (🟡 WARNING)**. Vấn đề mới **P-06**. Toàn bộ chi
> tiết, bằng chứng và cách sửa dứt điểm ở **Phụ lục A**.
>
> Các mục **§5 P-02** và **§6** của bản 1.0 được giữ nguyên văn để đối chiếu,
> **nhưng đã bị Phụ lục A thay thế**. Đừng hành động theo chúng.

---

## 1. EXECUTIVE SUMMARY

**Môi trường phát triển Claude Code ở trạng thái LÀNH MẠNH. Không có lỗi nghiêm
trọng. Không có việc gì phải làm gấp.**

Cảnh báo `install_failed` mà Board nêu ra là **cảnh báo lịch sử, đã được giải
quyết**. Lần cập nhật gần nhất — `2.1.220 → 2.1.221`, lúc **12:43:23 ngày
04/08/2026** — kết thúc với `outcome: "success"`. Bản mới nhất hiện hành trên npm
registry cũng là `2.1.221`; máy trạm **không hề tụt hậu**.

Tuy vậy lần cập nhật đó để lại **một dấu vết vật lý đo được**: một thư mục tạm
của npm bị bỏ quên, chứa đúng một tệp — bản `claude.exe` cũ `2.1.220`, dung lượng
**253,4 MB**. Chúng tôi đã truy được **nguyên nhân gốc chính xác, có bằng chứng
kiểm chứng được** (không suy đoán):

> Tệp `claude.exe` cũ **đang bị khoá** vì **hai phiên Claude Code đang chạy**
> (PID 4436 và PID 15968) đều đang *thực thi chính tệp đó* dưới dạng ảnh tiến
> trình (mapped image). Windows **cho phép đổi tên** nhưng **cấm ghi đè/xoá hẳn**
> một tệp đang được nạp làm ảnh thực thi. npm vì thế đã dời cây thư mục cũ sang
> tên tạm `.claude-code-gEDMabDG`, cài bản mới thành công, nhưng **không dọn nổi**
> tệp `.exe` còn bị khoá.

Hệ quả thực tế của việc này rất nhỏ và **chỉ có hai điểm**:

1. **Hai phiên đang chạy vẫn đang thực thi mã `2.1.220`** — chứ không phải
   `2.1.221` đã nằm trên đĩa. Khởi động lại là xong.
2. **253,4 MB đĩa bị chiếm vô ích.** Sẽ tự giải phóng được ngay khi đóng hết
   phiên Claude.

Ngoài ra có một cảnh báo `pending install scripts`. Đã truy nguyên: **không liên
quan tới Claude Code, cũng không phải mã của Monica ONE** — đó là
`unrs-resolver@1.12.2`, một phụ thuộc bắc cầu của ESLint. Đã **chứng minh bằng thực
nghiệm** rằng nó **không gây hỏng gì** (`npm run lint` → *No ESLint warnings or
errors*, exit 0). **Khuyến nghị: KHÔNG phê duyệt.**

**Điểm sức khoẻ: 92/100 — HEALTHY.**
**Kết luận: môi trường ĐỦ ĐIỀU KIỆN cho phát triển doanh nghiệp dài hạn Monica ONE.**

---

## 2. ENVIRONMENT — HIỆN TRẠNG

### 2.1 Claude Code

| Hạng mục | Giá trị | Nguồn bằng chứng |
|---|---|---|
| Bản **cài trên đĩa** | **2.1.221** | `package.json` · resource `FileVersion` của `claude.exe` |
| Bản **đang chạy trong bộ nhớ** | **2.1.220** ⚠️ | mốc thời gian tiến trình vs mốc ghi tệp (§3.4) |
| Bản **mới nhất trên registry** | **2.1.221** (`latest`) | `npm view` |
| Nhãn `stable` trên registry | 2.1.220 | `npm view` |
| Phương thức cài | **npm global** | `installMethod: "global"` trong `~/.claude.json` |
| npm prefix | `C:\Users\JOSEP\AppData\Roaming\npm` | `npm prefix -g` |
| Nhị phân trên PATH | `...\Roaming\npm\claude{,.cmd,.ps1}` | `where.exe claude` |
| Ảnh thực thi thật | `...\@anthropic-ai\claude-code\bin\claude.exe` | `Win32_Process.CommandLine` |
| Trình cài bản địa (native) | **KHÔNG có** | 5 vị trí chuẩn đều vắng mặt |
| Quyền ghi thư mục global | **CÓ** | thử tạo/xoá tệp thăm dò → `WRITABLE` |

### 2.2 Nền Node

| Hạng mục | Giá trị |
|---|---|
| Node | `v24.18.0` — `C:\Program Files\nodejs\node.exe` |
| npm | `11.16.0` |
| npm global root | `C:\Users\JOSEP\AppData\Roaming\npm\node_modules` |
| npm cache | `C:\Users\JOSEP\AppData\Local\npm-cache` |
| `~/.npmrc` | **không tồn tại** (toàn bộ dùng mặc định) |
| `ignore-scripts` | `false` |
| `logs-max` | `10` |
| Kết nối registry | **PONG 495 ms** |
| Đĩa C: còn trống | 177,6 GB |

### 2.3 Các bản Claude khác trên máy — KHÔNG xung đột

Đã tìm toàn bộ hồ sơ người dùng, có **6** tệp `claude.exe`. Chỉ **1** nằm trên PATH.

| Đường dẫn | Bản | Vai trò | Xung đột? |
|---|---|---|---|
| `Roaming\npm\...\claude-code\bin\claude.exe` | 2.1.221 | **CLI chính, trên PATH** | — |
| `Roaming\npm\...\claude-code-win32-x64\claude.exe` | 2.1.221 | hardlink của dòng trên | Không |
| `.claude-code-gEDMabDG\...\claude.exe` | 2.1.220 | **rác mồ côi, đang bị khoá** | Xem §5 P-02 |
| `.vscode\extensions\anthropic.claude-code-2.1.220-...` | 2.1.220 | tiện ích VS Code | Không |
| `.vscode-server\extensions\anthropic.claude-code-2.1.220-...` | 2.1.220 | tiện ích VS Code Remote | Không |
| `...\Packages\Claude_pzs8sxrjxfjjc\...\2.1.197\claude.exe` | 2.1.197 | ứng dụng Claude Desktop | Không |

> **Giải thích chênh lệch phiên bản.** Tiện ích VS Code (2.1.220) và Claude Desktop
> (2.1.197) đóng gói nhị phân **riêng**, phát hành theo **kênh riêng** (Marketplace /
> Microsoft Store). Chúng **không** được auto-updater của CLI quản lý và **không**
> nằm trên PATH. Việc chúng cũ hơn là **đúng thiết kế, không phải lỗi**.

### 2.4 PATH

Chỉ **2** mục liên quan, đúng thứ tự, **không có hiện tượng che khuất (shadowing)**:

```
C:\Program Files\nodejs\
C:\Users\JOSEP\AppData\Roaming\npm
```

### 2.5 Biến môi trường của phiên

```
CLAUDECODE = 1
CLAUDE_CODE_ENTRYPOINT = cli
CLAUDE_CODE_SESSION_ID = b04e39ff-2e47-47c1-850f-0172b912ebbe
CLAUDE_PID = 15968
CLAUDE_CODE_SSE_PORT = 15484
CLAUDE_CODE_CHILD_SESSION = 1
NoDefaultCurrentDirectoryInExePath = 1
```

**Không có** biến nào thuộc nhóm vô hiệu hoá cập nhật
(`DISABLE_AUTOUPDATER`, `CLAUDE_CODE_DISABLE_*`…).

---

## 3. EVIDENCE — BẰNG CHỨNG

### 3.1 Kết quả cập nhật gần nhất

`C:\Users\JOSEP\.claude\.last-update-result.json` — ghi lúc 04/08/2026 12:43:23:

```json
{"timestamp":"2026-08-04T05:43:23.267Z","path":"npm-global","outcome":"success",
 "status":"success","version_from":"2.1.220","version_to":"2.1.221","error_code":null}
```

> `error_code: null` · `outcome: "success"`. **Auto Update hiện đang lành mạnh.**

### 3.2 Đối chiếu phiên bản đĩa ↔ registry

```
package.json (đã cài)                       → 2.1.221
claude-code-win32-x64/package.json          → 2.1.221
claude.exe → FileVersion / ProductVersion   → 2.1.221.0  (Anthropic PBC)
npm view @anthropic-ai/claude-code           → latest: 2.1.221 · stable: 2.1.220
```

Bốn nguồn độc lập **khớp nhau ở 2.1.221**. Không có sai lệch cài đặt.

### 3.3 Thư mục rác mồ côi

```
C:\Users\JOSEP\AppData\Roaming\npm\node_modules\@anthropic-ai\
  ├── claude-code               ← bản 2.1.221 hợp lệ (ghi 12:43:22)
  └── .claude-code-gEDMabDG     ← RÁC (thư mục ghi 12:43:23)
        └── node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe
```

```
Số tệp còn lại trong thư mục rác : 1
Dung lượng                        : 265.720.480 byte (253,4 MB)
CreationTime                      : 29/07/2026 14:16:48
LastWriteTime                     : 29/07/2026 14:16:57
```

Chỉ còn **đúng một** tệp — mọi thứ khác npm đã dọn được. Tệp sống sót chính là
`claude.exe` bản `2.1.220`.

### 3.4 Bằng chứng KHOÁ TỆP — mấu chốt của toàn bộ vụ việc

Phép thử: mở tệp với `FileShare.None` ở hai mức truy cập. `ReadWrite/None` bị
chặn ⇒ có tiến trình khác đang giữ tệp.

| Tệp | `Read/None` | `ReadWrite/None` | Kết luận |
|---|---|---|---|
| `claude-code\bin\claude.exe` (2.1.221) | OK | **OK** | **Không bị khoá** |
| `claude-code-win32-x64\claude.exe` (2.1.221) | OK | **OK** | **Không bị khoá** |
| `.claude-code-gEDMabDG\...\claude.exe` (2.1.220) | OK | **❌ BỊ CHẶN** | **ĐANG BỊ KHOÁ** |

```
BLOCKED: The process cannot access the file
'...\.claude-code-gEDMabDG\node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe'
because it is being used by another process.
```

> ⚠️ **Ghi chú phương pháp — một phép thử sai đã suýt dẫn tới kết luận sai.**
> Vòng đo đầu tiên chỉ dùng `Read/None` và trả về *"không bị khoá"* cho **cả ba**
> tệp. Kết quả đó **mâu thuẫn** với việc hai tiến trình đang chạy. Ảnh thực thi
> được Windows mở kèm `FILE_SHARE_READ | FILE_SHARE_DELETE` — nên phép thử chỉ-đọc
> **không** phát hiện được xung đột. Phải yêu cầu quyền **ghi** mới lộ ra.
> Phát hiện mâu thuẫn ⇒ đo lại ⇒ mới ra sự thật. Kết luận trong §3.4 dựa trên vòng
> đo thứ hai.

### 3.5 Bằng chứng HARDLINK — vì sao chỉ còn sót đúng một tệp

`install.cjs` của gói (dòng 100–130) **ưu tiên hardlink**, chỉ `copyFileSync` khi
hardlink thất bại:

```js
// Try hardlink first (instant, zero extra disk for a ~500MB binary; src and ...
linkSync(src, dest)
```

Kiểm chứng trên cặp tệp 2.1.221 hiện hành:

```
> fsutil hardlink list ...\claude-code\bin\claude.exe
\...\claude-code\node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe
\...\claude-code\bin\claude.exe          ← 2 tên, 1 file object
```

Kiểm chứng trên tệp rác:

```
> fsutil hardlink list ...\.claude-code-gEDMabDG\...\claude.exe
\...\.claude-code-gEDMabDG\node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe
                                          ← chỉ còn 1 tên
```

**Đọc ra được:** bản 2.1.220 cũng từng có 2 tên (`bin\` và
`claude-code-win32-x64\`). npm đã **gỡ bỏ thành công tên thứ nhất**, nhưng
**không gỡ được tên thứ hai** vì file object phía dưới đang là ảnh thực thi sống.
Đây là lý do thư mục rác còn lại **đúng 1 tệp** chứ không phải cả cây thư mục.

### 3.6 Tiến trình đang chạy

```
PID   Tên          Khởi động            RAM     Tiến trình cha
4436  claude.exe   04/08 07:46:06      484 MB  powershell 15940 ← Code.exe
15968 claude.exe   04/08 12:43:14      446 MB  powershell 21744 ← Code.exe 15900/16060
```

Cây tiến trình của **chính phiên kiểm toán này**:

```
explorer.exe 8744
└─ Code.exe 16060 (VS Code)
   └─ Code.exe 15900
      └─ powershell.exe 21744
         └─ claude.exe 15968   ← CLAUDE_PID=15968 · phiên đang viết báo cáo này
            └─ powershell.exe 16704 (công cụ chạy lệnh)
```

Cả hai tiến trình đều khởi chạy **không kèm tham số dòng lệnh nào**.

**Mốc thời gian quyết định:**

```
07:46:06  PID 4436  khởi động  →  nạp ảnh 2.1.220
12:43:14  PID 15968 khởi động  →  nạp ảnh 2.1.220
12:43:21  tệp 2.1.221 được TẠO MỚI (CreationTime)
12:43:22  tệp 2.1.221 ghi xong (LastWriteTime)
12:43:23  auto-updater ghi outcome=success
```

> Cả hai tiến trình khởi động **TRƯỚC** thời điểm tệp mới ra đời. Tệp 2.1.221 là
> **tệp mới hoàn toàn** (`CreationTime = 12:43:21`, không phải ghi đè), và
> **không tiến trình nào đang giữ nó** (§3.4). ⇒ **Hai phiên đang chạy mã 2.1.220.**
> Lệnh `claude --version` in ra `2.1.221` vì nó **sinh tiến trình con mới** đọc
> tệp trên đĩa — con số đó **không phản ánh** phiên đang chạy.
> Củng cố thêm: `~/.claude.json` ghi `lastOnboardingVersion: "2.1.220"`.

### 3.7 Pending install scripts

```
> npm approve-scripts --allow-scripts-pending      (tại D:\monicagarmenterp\monica-erp)
1 package has install scripts not yet covered by allowScripts:
  unrs-resolver@1.12.2 (install: (install scripts present))
```

Truy nguồn gốc:

```
> npm ls unrs-resolver
monica-garment-erp@1.0.0
└─┬ eslint-config-next@14.2.15
  └─┬ eslint-import-resolver-typescript@3.10.1
    └── unrs-resolver@1.12.2
```

Với gói cài **global** thì cơ chế này **không áp dụng**:

```
> npm approve-scripts --allow-scripts-pending --global
npm error code EGLOBAL
npm error `npm approve-scripts` does not work for global installs
```

Nội dung script (`node_modules/unrs-resolver/postinstall.js`, 156 byte):

```js
const { checkAndPreparePackage } = require("napi-postinstall");
const packageJson = require("./package.json");
checkAndPreparePackage(packageJson, true);
```

**Thực nghiệm chứng minh script này thừa:**

```
> node -e "require('unrs-resolver')"
LOADS OK -> sync,ModuleType,EnforceExtension,ResolveTask,ResolverFactory,ResolveDtsTask

> ls node_modules/@unrs
resolver-binding-win32-x64-msvc          ← binding gốc ĐÃ CÓ SẴN

> npm run lint
✔ No ESLint warnings or errors           exit=0
```

### 3.8 Postinstall của chính Claude Code

```
"scripts": { "postinstall": "node install.cjs", "prepare": "..." }
```

Bằng chứng **đã chạy xong**: `bin/claude.exe` tồn tại, 278.279.328 byte,
`FileVersion 2.1.221.0`, tạo lúc 12:43:21. Không có postinstall nào của Claude
Code đang treo.

### 3.9 Remote Control

| Kiểm tra | Kết quả |
|---|---|
| Cờ CLI tồn tại | `--remote-control [name]` · `--remote-control-session-name-prefix <prefix>` |
| Khoá cấu hình trong `~/.claude.json` | **chỉ** `remoteControlUpsellSeenCount: 3` |
| Khối `remoteControl` trong settings | **không có** |
| `~/.claude/settings.json` | `{"permissions":{"defaultMode":"auto"},"theme":"dark"}` |
| Managed settings (doanh nghiệp) | `C:\ProgramData\ClaudeCode\managed-settings.json` → **không tồn tại** |
| Phiên khởi chạy kèm `--remote-control` | **không** — cả 2 tiến trình chạy trần |

**Phán định:** Remote Control **CHƯA từng được bật**. `remoteControlUpsellSeenCount: 3`
chỉ đếm số lần hiển thị lời mời dùng thử — **không phải** dấu hiệu đã kích hoạt.
Hành vi kỳ vọng: tắt cho tới khi người dùng chủ động chạy `claude --remote-control`.
**Sức khoẻ: N/A** — tính năng không bật thì không có gì để hỏng. Không phải lỗi.

### 3.10 Bảo mật · Chính sách · Quyền

| Kiểm tra | Kết quả | Có chặn cập nhật không? |
|---|---|---|
| ExecutionPolicy CurrentUser | `Bypass` | Không |
| ExecutionPolicy Process | `Bypass` | Không |
| MachinePolicy / UserPolicy | `Undefined` | Không |
| Ghi vào npm global | `WRITABLE` | Không |
| Windows Defender | Bật · RealTime `True` · Tamper `True` · mode `Normal` | Không thấy dấu hiệu |
| Phần mềm AV khác | **chỉ** Windows Defender | Không |
| Lịch sử phát hiện của Defender | 10 mục — Chrome ext · `V9.exe` · `dControl.exe` · `3utools` | **không mục nào** liên quan Claude/node/npm |
| Danh sách loại trừ của Defender | *không đọc được — cần quyền Administrator* | **chưa xác định** ⚠️ |

> **Điểm chưa xác minh được (nêu trung thực):** danh sách loại trừ của Defender
> yêu cầu quyền Administrator. **Không** vì thế mà kết luận có hay không có can
> thiệp. Tuy nhiên nguyên nhân gốc của sự cố **đã được xác định dứt điểm** ở §3.4–3.5
> là **khoá tệp**, nên khả năng Defender liên quan là **không cần thiết để giải
> thích hiện tượng**.

### 3.11 Nhật ký npm — bằng chứng đã mất, và mất vì ai

```
Thư mục : C:\Users\JOSEP\AppData\Local\npm-cache\_logs
Số tệp  : 11        logs-max = 10
Cũ nhất : 04/08/2026 12:44:21
Mới nhất: 04/08/2026 12:48:15
```

> ⚠️ **CÔNG BỐ TRUNG THỰC — cuộc điều tra này đã phá huỷ một phần bằng chứng.**
> npm chỉ giữ **10** tệp nhật ký gần nhất. Đợt chẩn đoán này đã gọi **khoảng 11 lệnh
> npm** (`view`, `ls`, `root`, `prefix`, `config`, `ping`, `approve-scripts`…), mỗi
> lệnh sinh **một** tệp nhật ký, **đẩy toàn bộ nhật ký cũ ra khỏi cửa sổ lưu trữ**.
> Nhật ký npm của lần cài đặt **thất bại** — thứ duy nhất ghi được **mã lỗi errno
> chính xác** (`EBUSY` / `EPERM` / `ENOTEMPTY`) — **đã mất, không khôi phục được.**
>
> Hậu quả với báo cáo này: **mã errno cụ thể của lần thất bại được đánh dấu là
> KHÔNG XÁC ĐỊNH.** Nguyên nhân gốc *cơ chế* thì **không** phụ thuộc nhật ký — nó
> đứng vững độc lập trên bằng chứng khoá tệp (§3.4) và hardlink (§3.5), cả hai đều
> đo trực tiếp và lặp lại được.
>
> **Bài học vận hành:** lần sau, **sao lưu `npm-cache\_logs` TRƯỚC** khi chạy bất
> kỳ lệnh npm chẩn đoán nào. Đã đưa vào checklist §8.

### 3.12 Bất thường cấu hình phát hiện thêm

`~/.claude.json` chứa **hai khoá dự án khác nhau chỉ ở chữ hoa/thường** của ký tự ổ đĩa:

```
DUPLICATE: ["d:/monicagarmenterp/monica-erp", "D:/monicagarmenterp/monica-erp"]
project entries: 4
```

`ConvertFrom-Json` của PowerShell **từ chối phân tích** tệp này:

```
Cannot convert the JSON string because a dictionary that was converted from the
string contains the duplicated keys 'd:/...' and 'D:/...'.
```

Hệ quả: lịch sử, danh sách quyền và trạng thái onboarding của **cùng một dự án**
bị **tách làm hai bản ghi**, tuỳ theo lúc mở phiên gõ `d:` hay `D:`. Đây là **lỗi
vệ sinh cấu hình mức thấp**, không ảnh hưởng chức năng, nhưng gây nhiễu về sau.

---

## 4. HEALTH SCORE

| Trục đánh giá | Điểm | Ghi chú |
|---|---|---|
| Tính đúng đắn của bản cài | 20/20 | 2.1.221 = `latest`; 4 nguồn khớp nhau |
| Sức khoẻ Auto Update | 19/20 | lần gần nhất `success`; còn sót rác dọn dở |
| Tính toàn vẹn nhị phân | 14/15 | hợp lệ, có chữ ký Anthropic PBC; 253,4 MB rác |
| Nền Node/npm | 15/15 | Node 24.18.0 · npm 11.16.0 · registry 495 ms |
| PATH & phân giải lệnh | 10/10 | không shadowing, một mục duy nhất |
| Bảo mật & quyền | 9/10 | ghi được; loại trừ Defender chưa đọc được |
| Vệ sinh cấu hình | 5/10 | khoá dự án trùng chữ hoa/thường (§3.12) |

### **TỔNG: 92 / 100 → 🟢 HEALTHY**

| Phân loại | Điều kiện | Đạt? |
|---|---|---|
| 🟢 **Healthy** | **90–100 · không có lỗi chặn** | ✅ **← hiện tại** |
| 🟡 Warning | 70–89 hoặc có suy giảm chức năng | — |
| 🔴 Critical | < 70 hoặc không dùng được | — |
| ⚪ Unknown | không thu thập được bằng chứng | — |

**Trừ điểm:** −4 runtime cũ hơn bản đã cài · −2 rác 253,4 MB · −1 khoá trùng
chữ hoa/thường · −1 cảnh báo pending script chưa dứt điểm.

---

## 5. PROBLEMS — DANH MỤC VẤN ĐỀ

### P-01 · Phiên đang chạy cũ hơn bản đã cài (2.1.220 vs 2.1.221)

| | |
|---|---|
| **Mức độ** | 🟡 Thấp — dự kiến trước, không suy giảm chức năng |
| **Bằng chứng** | §3.6 — cả 2 tiến trình khởi động trước 12:43:21; tệp 2.1.221 `CreationTime=12:43:21`, không tiến trình nào giữ (§3.4) |
| **Nguyên nhân gốc** | Auto-updater thay tệp trên đĩa **trong lúc** phiên đang chạy. Windows không thể tráo ảnh thực thi của tiến trình đang sống. Đây là **hành vi đúng theo thiết kế**, không phải lỗi. |
| **Rủi ro** | Không có lỗi vận hành. Thiếu các sửa lỗi/tính năng riêng của `2.1.221` cho tới khi khởi động lại. |
| **Khắc phục** | Thoát **mọi** phiên Claude Code rồi mở lại. |
| **Kiểm chứng** | Sau khi mở lại: `Get-Process claude` → `StartTime` mới; ảnh không còn giữ tệp 2.1.220 |
| **Thời gian** | ~1 phút |

### P-02 · Thư mục npm mồ côi chiếm 253,4 MB

| | |
|---|---|
| **Mức độ** | 🟡 Thấp — lãng phí đĩa, không ảnh hưởng chức năng |
| **Bằng chứng** | §3.3 (1 tệp, 265.720.480 byte) · §3.4 (`ReadWrite/None` **BỊ CHẶN**) · §3.5 (chỉ còn 1 hardlink) |
| **Nguyên nhân gốc** | **ĐÃ XÁC ĐỊNH DỨT ĐIỂM.** PID 4436 và PID 15968 đang thực thi tệp `claude.exe` 2.1.220 dưới dạng ảnh tiến trình. Windows cho đổi tên nhưng cấm ghi đè/xoá. npm dời cây cũ sang `.claude-code-gEDMabDG`, gỡ được hardlink `bin\`, **không gỡ được** hardlink còn lại, và bỏ dở việc dọn. |
| **Rủi ro khi để nguyên** | Rất thấp. Sẽ tích thêm một thư mục rác nữa ở **mỗi** lần cập nhật diễn ra khi có phiên đang chạy — về lâu dài là rò rỉ đĩa. |
| **Rủi ro khi sửa** | Rất thấp — chỉ chứa **một** nhị phân đã lỗi thời, không có cấu hình, không có dữ liệu người dùng. Đã đối chiếu: bản 2.1.221 **hoàn chỉnh và độc lập** với thư mục này. |
| **Khắc phục** | Đóng hết phiên Claude → `Remove-Item ...\.claude-code-gEDMabDG -Recurse -Force` |
| **Kiểm chứng** | `Test-Path` → `False`; sau đó `claude --version` → `2.1.221` |
| **Thời gian** | ~2 phút |

> ⛔ **KHÔNG THỂ SỬA TỪ BÊN TRONG PHIÊN NÀY.** Phiên kiểm toán này **chính là**
> PID 15968 — một trong hai tiến trình đang giữ khoá. Xoá từ đây chắc chắn thất bại.
> Xem §6.

### P-03 · Cảnh báo pending install script — `unrs-resolver@1.12.2`

| | |
|---|---|
| **Mức độ** | 🔵 Thông tin — **không** phải lỗi |
| **Bằng chứng** | §3.7 |
| **Là Claude Code?** | **KHÔNG.** Gói global được miễn cơ chế này (`EGLOBAL`). |
| **Là Monica ONE?** | **KHÔNG.** Không phải mã của dự án. |
| **Vậy là gì?** | Phụ thuộc **bắc cầu bậc ba** của bên thứ ba: `eslint-config-next` → `eslint-import-resolver-typescript` → `unrs-resolver`. Chỉ dùng lúc phát triển. |
| **Nguyên nhân gốc** | npm 11 **mặc định chặn** install script của phụ thuộc cho tới khi được duyệt tường minh — đây là **cải tiến bảo mật chuỗi cung ứng**, không phải hỏng hóc. |
| **Nên phê duyệt không?** | ❌ **KHÔNG.** |
| **Vì sao không** | Script chỉ là bộ tải dự phòng `napi-postinstall`, tải native binding **khi thiếu**. Binding **đã có sẵn** (`@unrs/resolver-binding-win32-x64-msvc`). Đã chứng minh: `require()` nạp OK; `npm run lint` → **0 lỗi, exit 0**. Phê duyệt = mở quyền chạy mã tuỳ ý lúc cài đặt **mà không đổi lại được lợi ích nào**. |
| **Khắc phục** | **Giữ nguyên.** Nếu Board muốn dứt điểm cảnh báo: `npm deny-scripts unrs-resolver`. ⚠️ Lệnh này **ghi vào `package.json` của Monica ONE** ⇒ vượt phạm vi Chỉ thị ⇒ **cần Board chấp thuận riêng.** |
| **Kiểm chứng** | `npm run lint` → exit 0 (đã chạy, đã đạt) |
| **Thời gian** | 0 — không cần làm gì |

### P-04 · Khoá dự án trùng lặp chữ hoa/thường trong `~/.claude.json`

| | |
|---|---|
| **Mức độ** | 🟡 Thấp — vệ sinh cấu hình |
| **Bằng chứng** | §3.12 |
| **Nguyên nhân gốc** | Phiên Claude được khởi chạy từ thư mục làm việc lúc ghi `d:\`, lúc ghi `D:\`. Windows không phân biệt hoa/thường ở đường dẫn, nhưng khoá JSON thì **có**. |
| **Rủi ro** | Lịch sử và danh sách quyền của cùng một dự án bị tách đôi. Một số bộ phân tích JSON nghiêm ngặt **từ chối** đọc tệp. |
| **Khắc phục** | Đóng hết phiên Claude → sao lưu `~/.claude.json` → hợp nhất hai mục thành `D:/monicagarmenterp/monica-erp`. |
| **Kiểm chứng** | Chạy lại bộ dò trùng → `project entries: 3`, không còn `DUPLICATE` |
| **Thời gian** | ~5 phút |

> ⚠️ **Không được sửa khi còn phiên đang mở.** Claude Code ghi đè `~/.claude.json`
> lúc thoát; hai phiên đang chạy sẽ **ghi đè lên bản vá** (kẻ thoát sau thắng).

### P-05 · Loại trừ Windows Defender chưa đọc được

| | |
|---|---|
| **Mức độ** | ⚪ Unknown — hạn chế đo đạc, **không** phải phát hiện |
| **Bằng chứng** | §3.10 — `Get-MpPreference` → *"Must be an administrator to view exclusions"* |
| **Ảnh hưởng tới kết luận** | **Không.** Nguyên nhân gốc P-02 đã xác định độc lập và dứt điểm bằng phép đo khoá tệp. Không cần viện tới Defender để giải thích bất cứ hiện tượng nào đã quan sát. |
| **Khắc phục** | Không cần. Nếu Board muốn khép kín: chạy `Get-MpPreference` trong PowerShell **Administrator**. |
| **Thời gian** | ~1 phút (nếu muốn) |

---

## 6. REPAIRS — THAO TÁC ĐÃ THỰC HIỆN

### 🚫 **KHÔNG thực hiện thao tác sửa chữa nào. Cố ý.**

Chỉ thị của Board (Bước 9): *"Only if necessary perform the safest repair."*
**Không có sửa chữa nào là cần thiết** — môi trường đang vận hành đầy đủ chức năng.

Thêm vào đó, **ba trong bốn** khắc phục (P-01, P-02, P-04) đều yêu cầu **đóng
toàn bộ phiên Claude Code**. Phiên kiểm toán này **chính là PID 15968**, một trong
hai phiên đó. Từ bên trong, các lựa chọn chỉ gồm:

| Phương án | Vì sao bị loại |
|---|---|
| `Stop-Process -Id 4436` | ❌ Đó là **phiên làm việc sống khác** (chạy từ 07:46, 484 MB). Kết thúc cưỡng bức có thể **mất công việc chưa lưu** của Board. Là thao tác **phá huỷ** — Chỉ thị cấm. |
| Tự kết thúc PID 15968 | ❌ Huỷ luôn đợt kiểm toán trước khi giao được báo cáo. |
| Xoá thư mục rác ngay | ❌ **Chắc chắn thất bại** — chính tiến trình này đang giữ khoá (§3.4). |
| Vá `~/.claude.json` ngay | ❌ Hai phiên sống sẽ **ghi đè** bản vá lúc thoát. |

**Kết luận:** phương án an toàn nhất, đúng như Chỉ thị đòi hỏi, là **ghi lại đầy
đủ và bàn giao cho Board thao tác** — chứ không phải kết thúc cưỡng bức tiến trình
của người dùng. Toàn bộ lệnh cần chạy nằm ở §7.

**Đã đọc, KHÔNG sửa:** `~/.claude.json` · `~/.claude/settings.json` ·
`.last-update-result.json` · `package.json` (global) · `install.cjs` ·
`node_modules/unrs-resolver/postinstall.js`.

**Chưa từng chạm tới:** mã nguồn Monica ONE · CSDL · `00-CONSTITUTION.md` ·
`BUSINESS_KNOWLEDGE_BASE.md` · `docs/adr/` · migration.
Tệp **duy nhất** được tạo trong repo là chính báo cáo này.

---

## 7. VERIFICATION — QUY TRÌNH XÁC MINH

### 7.1 Đã xác minh trong đợt kiểm toán (bằng chứng ở §3)

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | Bản cài trên đĩa = `latest` trên registry | ✅ 2.1.221 = 2.1.221 |
| 2 | Nhị phân hợp lệ, đúng nhà phát hành | ✅ `FileVersion 2.1.221.0` · Anthropic PBC |
| 3 | Kết quả cập nhật gần nhất | ✅ `outcome: success` · `error_code: null` |
| 4 | Không có postinstall của Claude Code bị treo | ✅ `bin/claude.exe` 278 MB đã có mặt |
| 5 | Pending script không phải của Claude/Monica | ✅ `unrs-resolver`, bậc 3, bên thứ ba |
| 6 | Pending script không gây hỏng | ✅ `npm run lint` exit 0, 0 lỗi |
| 7 | Nhị phân 2.1.221 **không** bị khoá | ✅ `ReadWrite/None` mở được |
| 8 | Nhị phân 2.1.220 **có** bị khoá | ✅ sharing violation — đúng như dự đoán |
| 9 | PATH không shadowing | ✅ 1 mục duy nhất |
| 10 | npm global ghi được | ✅ `WRITABLE` |
| 11 | Registry tới được | ✅ PONG 495 ms |
| 12 | Execution Policy không chặn | ✅ `Bypass` |
| 13 | Defender chưa từng chặn tệp Claude | ✅ 10/10 mục đều không liên quan |
| 14 | Không có managed settings áp đặt | ✅ không tồn tại |
| 15 | Remote Control đúng trạng thái mặc định | ✅ chưa bật, không lỗi |

### 7.2 Cần chạy lại SAU khi Board thực hiện §7.3

```powershell
# 1 · Không còn tiến trình Claude nào
Get-Process claude -ErrorAction SilentlyContinue        # kỳ vọng: rỗng

# 2 · Rác đã biến mất
Test-Path "$env:APPDATA\npm\node_modules\@anthropic-ai\.claude-code-gEDMabDG"
                                                        # kỳ vọng: False

# 3 · Bản cài còn nguyên vẹn sau khi dọn
claude --version                                        # kỳ vọng: 2.1.221

# 4 · Phiên mới thực sự chạy 2.1.221
Get-Process claude | Select-Object Id,StartTime         # StartTime > lúc dọn

# 5 · Không còn khoá tệp tồn đọng
Get-ChildItem "$env:APPDATA\npm\node_modules\@anthropic-ai" -Force |
  Select-Object Name                                    # kỳ vọng: chỉ 'claude-code'

# 6 · Không còn khoá dự án trùng (sau khi vá P-04)
node -e "const j=require(require('os').homedir()+'/.claude.json');const k=Object.keys(j.projects);const s=new Set(k.map(x=>x.toLowerCase()));console.log(k.length===s.size?'OK - khong trung':'VAN CON TRUNG')"
```

### 7.3 Trình tự khắc phục Board cần thực hiện

> Chạy trong PowerShell **thường** (không cần Administrator).
> Thực hiện **sau khi** đã đóng mọi cửa sổ Claude Code, kể cả terminal trong VS Code.

```powershell
# BƯỚC 1 — xác nhận đã đóng hết phiên
Get-Process claude -ErrorAction SilentlyContinue
# Nếu còn: thoát thủ công bằng Ctrl+C / /exit trong từng cửa sổ.
# KHÔNG dùng Stop-Process nếu còn công việc chưa lưu.

# BƯỚC 2 — sao lưu cấu hình trước khi động vào (P-04)
Copy-Item "$env:USERPROFILE\.claude.json" `
          "$env:USERPROFILE\.claude\backups\.claude.json.pre-audit-repair" -Force

# BƯỚC 3 — dọn 253,4 MB rác (P-02)
$orphan = "$env:APPDATA\npm\node_modules\@anthropic-ai\.claude-code-gEDMabDG"
if (Test-Path $orphan) { Remove-Item $orphan -Recurse -Force; "Da don." }
else { "Khong con - npm da tu don." }

# BƯỚC 4 — mở lại Claude (P-01 tự khỏi)
claude --version        # kỳ vọng: 2.1.221
```

> **P-04 (khoá trùng chữ hoa/thường)** cần biên tập JSON có chủ đích — hợp nhất
> hai mục và giữ lại phần lịch sử phong phú hơn. **Không đưa vào script tự động**
> vì làm sai sẽ mất lịch sử dự án. Board yêu cầu thì sẽ làm riêng, có bản sao lưu ở
> Bước 2 bảo đảm.

---

## 8. MAINTENANCE CHECKLIST

### Hằng tuần — 2 phút

```powershell
claude --version
Get-Process claude | Measure-Object | Select-Object Count      # lý tưởng: 0–1
Get-Content "$env:USERPROFILE\.claude\.last-update-result.json"
Get-ChildItem "$env:APPDATA\npm\node_modules\@anthropic-ai" -Force | Select-Object Name
```

| Dấu hiệu | Ý nghĩa | Xử lý |
|---|---|---|
| Có thư mục `.claude-code-*` | Cập nhật diễn ra khi đang có phiên chạy | Đóng hết phiên → xoá |
| `outcome != "success"` | Cập nhật thất bại | **Sao lưu `npm-cache\_logs` NGAY** rồi mới chẩn đoán |
| `Count` ≥ 2 | Nhiều phiên song song | Chấp nhận được, nhưng lần cập nhật tới sẽ để lại rác |

### Hằng tháng — 5 phút

```powershell
npm view @anthropic-ai/claude-code version      # đối chiếu với claude --version
npm ls -g --depth=0
node --version ; npm --version
"{0} GB free" -f [math]::Round((Get-PSDrive C).Free/1GB,1)
```

### Trước mỗi lần nâng cấp Claude Code

1. ☐ Đóng **mọi** phiên Claude Code (kể cả terminal trong VS Code) — **đây là biện
   pháp phòng ngừa quan trọng nhất**; chính nó ngăn P-01 và P-02 tái diễn.
2. ☐ Sao lưu `~/.claude.json`.
3. ☐ Nâng cấp: `claude update` **hoặc** `npm i -g @anthropic-ai/claude-code@latest`.
4. ☐ Kiểm chứng: `claude --version` khớp `npm view ... version`.
5. ☐ Xác nhận không có thư mục `.claude-code-*` mới sinh ra.

### Trước mỗi lần chẩn đoán bằng npm — **rút ra từ chính sự cố §3.11**

```powershell
# LÀM VIỆC NÀY TRƯỚC TIÊN. npm chỉ giữ 10 nhật ký; lệnh chẩn đoán sẽ xoá sổ chúng.
Copy-Item "$env:LOCALAPPDATA\npm-cache\_logs" `
          "$env:USERPROFILE\.claude\backups\npm-logs-$(Get-Date -f yyyyMMdd-HHmm)" -Recurse
```

### Quy tắc thường trực

- ❌ **Không** phê duyệt install script chỉ để cho hết cảnh báo. Bắt buộc chứng
  minh bằng thực nghiệm rằng nó **cần thiết** — xem P-03 làm mẫu.
- ❌ **Không** `Stop-Process` một phiên Claude còn công việc chưa lưu.
- ✅ Ưu tiên **một** phiên hoạt động tại một thời điểm; phiên thứ hai chính là thứ
  đã tạo ra P-02.
- ✅ Khi phép đo mâu thuẫn với thực tế quan sát, **đo lại bằng phương pháp khác** —
  xem §3.4, nơi phép thử chỉ-đọc suýt dẫn tới kết luận sai.

---

## 9. SUCCESS CRITERIA — ĐỐI CHIẾU

| Tiêu chí của Board | Trạng thái | Bằng chứng |
|---|---|---|
| Cài đặt lành mạnh | ✅ **ĐẠT** | §3.2 — 4 nguồn khớp ở 2.1.221 |
| Đúng phiên bản | ✅ **ĐẠT** (trên đĩa) · ⏳ cần khởi động lại (trong bộ nhớ) | §3.2 · §3.6 |
| Auto Update lành mạnh | ✅ **ĐẠT** | §3.1 — `outcome: success` |
| Không còn vấn đề cài đặt Claude treo | ✅ **ĐẠT** | §3.8 — postinstall đã hoàn tất |
| Không có khoá tệp thực thi | ⏳ **CÒN 1** — trên nhị phân **cũ**, đã lý giải xong | §3.4 · P-02 |
| Sẵn sàng cho phát triển doanh nghiệp | ✅ **ĐẠT** | Score 92/100 · không lỗi chặn |
| Mọi phát hiện dựa trên bằng chứng | ✅ **ĐẠT** | Mọi khẳng định đều dẫn lệnh + kết quả |
| Không sửa mã nguồn Monica ONE | ✅ **ĐẠT** | §6 |
| Không sửa tài liệu nghiệp vụ | ✅ **ĐẠT** | §6 |

### Phán quyết cuối

> **Môi trường phát triển Claude Code ĐỦ ĐIỀU KIỆN cho phát triển doanh nghiệp
> dài hạn Monica ONE.**
>
> Cảnh báo `install_failed` **là lịch sử và đã tự giải quyết**. Nguyên nhân gốc
> **đã truy được dứt điểm bằng đo đạc trực tiếp** — không phải suy đoán — là khoá
> ảnh thực thi do có nhiều phiên chạy song song, kèm bằng chứng hardlink giải thích
> vì sao rác còn lại đúng một tệp.
>
> Bốn vấn đề tồn đọng đều **ở mức thấp hoặc chỉ mang tính thông tin**; **không**
> vấn đề nào chặn công việc. Toàn bộ khắc phục **không phá huỷ**, gộp lại mất
> **dưới 10 phút**, và cần Board thao tác chỉ vì phiên kiểm toán này tự nó là một
> trong hai tiến trình đang giữ khoá.
>
> **Một phần bằng chứng đã bị chính cuộc điều tra này phá huỷ** (§3.11) và điều đó
> được nêu công khai chứ không giấu. Việc đó **không** làm lung lay kết luận về
> nguyên nhân gốc, vốn đứng độc lập trên hai phép đo lặp lại được.

---

---

## PHỤ LỤC A — THAO TÁC KHẮC PHỤC 14:31 VÀ KẾT QUẢ THỰC TẾ

> **Uỷ quyền:** Board chỉ đạo bằng lời — *"đóng phiên 4436 rồi dọn thư mục rác đó"*.
> **Thực hiện:** 04/08/2026, 14:31–14:35.
> **Kết quả: MỘT PHẦN — mục tiêu thứ hai thất bại theo cách không lường trước.**

### A.1 Đã làm gì

| # | Thao tác | Kết quả |
|---|---|---|
| 1 | Sao lưu `~/.claude.json` → `backups\.claude.json.pre-repair-20260804-143148` | ✅ 42.411 byte |
| 2 | Sao lưu `npm-cache\_logs` → `backups\npm-logs-20260804-1431` | ✅ (rút kinh nghiệm §3.11) |
| 3 | `Stop-Process -Id 4436 -Force` | ✅ PID 4436 kết thúc |
| 4 | Đo lại khoá trên tệp rác | ⚠️ đổi từ *sharing violation* sang *"Could not find a part of the path"* |
| 5 | `Remove-Item` thư mục rác | **KHÔNG cần chạy** — `Test-Path` đã trả `False` |

PID 4436 lúc bị kết thúc: khởi động 07:46:06, 481 MB, `MainWindowHandle = 0`
(không có cửa sổ để đóng mềm). Không có tiến trình nào khác bị đụng tới.

### A.2 Điều thực sự đã xảy ra — đo được, không suy đoán

Thư mục `.claude-code-gEDMabDG` biến mất **mà không cần lệnh xoá nào**. Nhưng đo
tiếp thì lộ ra nó **không bị xoá** — nội dung của nó **quay về** vị trí gói thật:

| Đường dẫn | Trước 14:31 | Sau 14:31 |
|---|---|---|
| `.claude-code-gEDMabDG\...\claude.exe` | 265.720.480 · tạo 29/07 14:16:48 | **không còn** |
| `claude-code\node_modules\...\claude-code-win32-x64\claude.exe` | 278.279.328 · tạo 04/08 12:43:21 · **hardlink** với `bin\` | **265.720.480 · tạo 29/07 14:16:48** · không còn hardlink |
| `claude-code\bin\claude.exe` | 278.279.328 · hardlink | 278.279.328 · **tệp đơn lẻ** |

Kiểm chứng bằng resource phiên bản trong chính nhị phân:

```
bin\claude.exe                            → FileVersion 2.1.221.0   len 278.279.328
claude-code-win32-x64\claude.exe          → FileVersion 2.1.220.0   len 265.720.480   ⚠️
claude-code-win32-x64\package.json        → "version": "2.1.221"                      ⚠️ KHÔNG KHỚP
claude-code\package.json                  → "version": "2.1.221"
```

Hardlink đã tách hẳn:

```
> fsutil hardlink list ...\claude-code\bin\claude.exe
\...\claude-code\bin\claude.exe                        ← chỉ còn 1 tên (trước là 2)
```

Dung lượng — **không thu hồi được MB nào, thậm chí tốn thêm**:

```
Đĩa C: trống   : 177,6 GB  →  176,61 GB      (GIẢM)
Thư mục claude-code: 11 tệp, 519 MB           (= 265 MB + 278 MB, không còn chia sẻ khối)
```

> **Vì sao trước kia chỉ tốn 278 MB, nay tốn 519 MB:** hai tên tệp trước đây là
> **hardlink** trỏ chung một file object nên chỉ chiếm **một** lần dung lượng.
> Sau thao tác, chúng là **hai file object khác nhau** ⇒ chiếm **hai** lần.

**Cơ chế NTFS chính xác gây ra việc khôi phục ngược này: KHÔNG XÁC ĐỊNH.**
Không tái dựng được từ hiện vật còn lại. Ghi nhận đúng những gì đo được, không suy diễn.

### A.3 Đính chính các kết luận sai của bản 1.0

| Bản 1.0 khẳng định | Phán định | Sự thật |
|---|---|---|
| §5 P-02: *"chỉ chứa một nhị phân đã lỗi thời, không có dữ liệu"* | ⚠️ **đúng nhưng gây hiểu nhầm** | Nhị phân đó **quay lại thành nhị phân đang hoạt động của gói** |
| §5 P-02: *"bản 2.1.221 hoàn chỉnh và độc lập với thư mục này"* | ❌ **SAI** | Gói platform **mất** nhị phân 2.1.221, bị thay bằng 2.1.220 |
| §5 P-02: *"Rủi ro khi sửa: rất thấp"* | ❌ **ĐÁNH GIÁ THẤP** | Thao tác làm bản cài mất nhất quán và **tốn thêm 253 MB** |
| §3.6: *"cả hai phiên đang chạy mã 2.1.220"* | ✅ **ĐÚNG, được củng cố** | PID 15968 hiện **vẫn khoá** nhị phân 2.1.220 (phép đo A.2) |
| §3.1: *auto-update lần gần nhất `success`* | ✅ **ĐÚNG** | không thay đổi |
| §3.7: *pending script vô hại, không phê duyệt* | ✅ **ĐÚNG** | không thay đổi |

### A.4 P-06 · Bản cài không nhất quán nội bộ

| | |
|---|---|
| **Mức độ** | 🟡 Trung bình — chưa gây lỗi, nhưng có rủi ro tụt phiên bản âm thầm |
| **Bằng chứng** | A.2 — `package.json` 2.1.221 ⟷ `claude.exe` 2.1.220 trong **cùng một thư mục gói** |
| **Nguyên nhân gốc** | Thao tác khắc phục A.1 (cơ chế NTFS không xác định) |
| **Ảnh hưởng hiện tại** | **Không có.** PATH → `bin\claude.exe` → **2.1.221**. `claude --version` = 2.1.221. |
| **Rủi ro tiềm ẩn** | `install.cjs` tạo `bin\claude.exe` **từ** nhị phân gói platform. Nếu nó chạy lại (cài lại, sửa chữa, thao tác npm) nó sẽ chép **2.1.220 đè lên 2.1.221** ⇒ **tụt phiên bản âm thầm**, `claude --version` vẫn báo 2.1.221 vì `package.json` không đổi. |
| **Khắc phục** | Đóng **hết** phiên Claude → cài lại đè: `npm i -g @anthropic-ai/claude-code@latest --force` |
| **Kiểm chứng** | Cả hai nhị phân phải cùng `FileVersion 2.1.221.0`; `fsutil hardlink list` phải trả về **2** tên |
| **Thời gian** | ~3 phút |
| **Trạng thái** | ⏳ **CHƯA SỬA** — cần đóng phiên 15968, tức phiên đang viết dòng này |

### A.5 Điểm sức khoẻ sau khắc phục

| Trục | 1.0 | 1.1 | Lý do đổi |
|---|---|---|---|
| Tính đúng đắn bản cài | 20/20 | 20/20 | PATH vẫn chạy đúng 2.1.221 |
| Auto Update | 19/20 | 19/20 | không đổi |
| **Toàn vẹn nhị phân** | 14/15 | **7/15** | nhị phân gói platform lệch phiên bản (P-06) |
| Nền Node/npm | 15/15 | 15/15 | không đổi |
| PATH | 10/10 | 10/10 | không đổi |
| Bảo mật & quyền | 9/10 | 9/10 | không đổi |
| Vệ sinh cấu hình | 5/10 | 4/10 | thêm 253 MB trùng lặp |

### **TỔNG: 84 / 100 → 🟡 WARNING**

Hạ từ 🟢 HEALTHY. **Không** có lỗi chặn công việc — hạ bậc vì **rủi ro tụt phiên
bản tiềm ẩn** ở P-06, sẽ trở lại 🟢 sau khi cài lại.

### A.6 Việc Board cần làm — 3 phút, sau khi đóng hết phiên Claude

```powershell
# 1 · Không còn phiên nào
Get-Process claude -ErrorAction SilentlyContinue            # kỳ vọng: rỗng

# 2 · Cài lại đè — sửa dứt điểm P-06 VÀ P-01
npm i -g @anthropic-ai/claude-code@latest --force

# 3 · Kiểm chứng: HAI nhị phân phải cùng phiên bản
$r="$env:APPDATA\npm\node_modules\@anthropic-ai\claude-code"
(Get-Item "$r\bin\claude.exe").VersionInfo.FileVersion
(Get-Item "$r\node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe").VersionInfo.FileVersion
#    → cả hai phải là 2.1.221.0

# 4 · Kiểm chứng: hardlink đã nối lại (2 tên = chỉ tốn 1 lần dung lượng)
fsutil hardlink list "$r\bin\claude.exe"                    # kỳ vọng: 2 dòng

# 5 · Không còn thư mục rác
Get-ChildItem "$env:APPDATA\npm\node_modules\@anthropic-ai" -Force | Select-Object Name
#    → kỳ vọng: chỉ 'claude-code'
```

### A.7 Bài học đưa vào checklist §8

- ❌ **Không kết thúc phiên Claude khi bản cập nhật vừa chạy còn dang dở.** Đóng
  phiên trong lúc hệ tệp còn thao tác treo có thể **hoàn tác** kết quả cập nhật
  thay vì hoàn tất nó.
- ✅ **Đóng hết phiên TRƯỚC khi cập nhật**, không phải sau. Đây vẫn là biện pháp
  phòng ngừa hiệu quả nhất, và giờ có thêm lý do thứ hai.
- ✅ **Sau mọi thao tác dọn dẹp, đo lại `FileVersion` của TỪNG nhị phân** — sự
  biến mất của một thư mục **không** đồng nghĩa với việc nó đã bị xoá.
- ✅ **Đo dung lượng đĩa trước/sau.** Ở đây chính con số "trống ít đi" là manh
  mối đầu tiên cho thấy việc dọn dẹp đã không diễn ra như tưởng.

---

*Kết thúc kiểm toán · bản 1.1 · 04/08/2026 · Thao tác duy nhất tác động hệ thống:
kết thúc PID 4436 theo uỷ quyền của Board. Không có tệp nào bị xoá bằng lệnh.*
