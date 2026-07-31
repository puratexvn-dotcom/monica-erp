'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, FileQuestion } from 'lucide-react';

import Sheet from '@/components/sheet';
import { MANUALS } from '@/lib/manuals/manifest.generated';
import { moduleOfPath } from '@/lib/mos/mos-context';

// ============================================================================
// SÁCH HƯỚNG DẪN THEO NGỮ CẢNH
//
// Tự đọc đường dẫn để biết đang ở phân hệ nào rồi nạp đúng tệp Markdown. Người
// dùng đang bí ở màn hình nào thì mở ra đúng phần nói về màn hình đó, không
// phải tự dò trong một quyển hướng dẫn chung dài mấy chục trang.
//
// ─── VÌ SAO TỰ DỰNG BỘ ĐỌC MARKDOWN, KHÔNG CÀI THƯ VIỆN ──────────────────
// react-markdown kéo theo cả remark/unified, tính ra hơn 100 KB sau nén cho
// một khung TRỢ GIÚP mà phần lớn phiên làm việc không ai mở. Khung này lại nằm
// ở thanh điều hướng nên có mặt trên MỌI trang — 100 KB đó vào thẳng gói dùng
// chung, mọi người dùng đều phải tải dù không bao giờ bấm.
//
// Nội dung ở đây do chính dự án viết chứ không phải người dùng nhập, nên chỉ
// cần đúng phần cú pháp đang thật sự dùng. Bộ đọc dưới đây làm đủ chừng đó.
//
// ─── VÌ SAO KHÔNG DÙNG dangerouslySetInnerHTML ───────────────────────────
// Bộ đọc này dựng thẳng ra node React, không đi qua chuỗi HTML nào. Nhờ vậy
// không có đường nào để một dấu ngoặc nhọn trong tệp .md biến thành thẻ chạy
// được — an toàn theo cấu trúc chứ không nhờ khâu lọc.
// ============================================================================

// ─── PHÂN TÍCH PHẦN NỘI DÒNG ────────────────────────────────────────────────

type Inline =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'code'; value: string };

/** Nhận **đậm** và `mã`. Một lượt quét, không lồng nhau — đủ cho tài liệu này. */
function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null = re.exec(s);
  while (m !== null) {
    if (m.index > last) out.push({ kind: 'text', value: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: 'bold', value: m[1] });
    else out.push({ kind: 'code', value: m[2] });
    last = re.lastIndex;
    m = re.exec(s);
  }
  if (last < s.length) out.push({ kind: 'text', value: s.slice(last) });
  return out;
}

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === 'bold') {
          return (
            <strong key={i} className="font-bold text-slate-900">
              {p.value}
            </strong>
          );
        }
        if (p.kind === 'code') {
          return (
            <code
              key={i}
              // break-words: một mã dài (tên tệp migration chẳng hạn) không được
              // đẩy cả khung rộng ra ngoài viền trên màn 360px.
              className="break-words rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] font-bold text-blue-700"
            >
              {p.value}
            </code>
          );
        }
        return <span key={i}>{p.value}</span>;
      })}
    </>
  );
}

// ─── PHÂN TÍCH PHẦN KHỐI ────────────────────────────────────────────────────

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'hr' };

function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let para: string[] = [];

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ kind: 'p', text: para.join(' ') });
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim() === '') {
      flushPara();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushPara();
      blocks.push({ kind: 'hr' });
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      const kind = (['h1', 'h2', 'h3'] as const)[h[1].length - 1];
      blocks.push({ kind, text: h[2] });
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara();
      const quoted: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      i--; // vòng for sẽ tự tăng lại
      blocks.push({ kind: 'quote', lines: quoted });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      i--;
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      i--;
      blocks.push({ kind: 'ol', items });
      continue;
    }

    para.push(line.trim());
  }
  flushPara();
  return blocks;
}

// ─── DỰNG GIAO DIỆN ─────────────────────────────────────────────────────────
//
// Bảng màu pastel, mỗi cấp tiêu đề một tín hiệu thị giác khác nhau để mắt bắt
// được cấu trúc mà không cần đọc chữ:
//   H1 — băng xanh đậm, tên phân hệ
//   H2 — thanh dọc xanh bên trái, chương lớn
//   H3 — chữ đậm sẫm, mục nhỏ
// Trích dẫn dùng nền hổ phách vì trong tài liệu này nó luôn chứa CÔNG THỨC
// hoặc quy tắc bất di bất dịch — thứ cần dừng mắt lại.

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h1':
            return (
              <h1
                key={i}
                className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-lg font-black tracking-tight text-blue-800 sm:text-xl"
              >
                {b.text}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={i}
                className="mb-2 mt-7 border-l-4 border-blue-500 pl-3 text-base font-black tracking-tight text-slate-900 sm:text-lg"
              >
                {b.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="mb-1.5 mt-5 text-sm font-bold text-slate-800 sm:text-base">
                {b.text}
              </h3>
            );
          case 'hr':
            return <hr key={i} className="my-6 border-slate-200" />;
          case 'quote':
            return (
              <blockquote
                key={i}
                className="my-3 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 py-2.5 pl-3 pr-3 text-sm font-semibold leading-relaxed text-amber-900"
              >
                {b.lines.map((l, j) => (
                  <p key={j}>
                    <Inlines parts={parseInline(l)} />
                  </p>
                ))}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={i} className="my-2 space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <span
                      aria-hidden="true"
                      className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"
                    />
                    <span className="min-w-0 flex-1">
                      <Inlines parts={parseInline(it)} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="my-2 space-y-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-black tabular-nums text-blue-700">
                      {j + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Inlines parts={parseInline(it)} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={i} className="my-2 text-sm leading-relaxed text-slate-700">
                <Inlines parts={parseInline(b.text)} />
              </p>
            );
        }
      })}
    </>
  );
}

export default function ContextualGuideSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const mod = moduleOfPath(pathname);
  const source = MANUALS[mod.guide] ?? MANUALS['tong-quan'] ?? '';

  // Phân tích lại chỉ khi đổi phân hệ. Một tài liệu vài trăm dòng thì rẻ, nhưng
  // không có useMemo thì mỗi lần gõ phím ở nơi khác cũng kéo theo một lượt phân
  // tích lại toàn bộ, vì component này sống ở thanh điều hướng toàn cục.
  const blocks = useMemo(() => parseBlocks(source), [source]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Sách hướng dẫn"
      subtitle={`Đang xem phần: ${mod.label}`}
      size="full"
    >
      <div className="mx-auto min-w-0 max-w-3xl overflow-x-hidden px-4 py-4 sm:px-6">
        {blocks.length === 0 ? (
          // Không bịa nội dung thay thế: nói thẳng là chưa có tài liệu cho phần
          // này, kèm chỗ cần sửa để người tiếp theo biết phải làm gì.
          <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
            <FileQuestion className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">Chưa có hướng dẫn cho phần này</p>
            <p className="max-w-[20rem] text-xs">
              Thêm tệp{' '}
              <code className="rounded bg-slate-100 px-1 font-mono font-bold text-slate-600">
                lib/manuals/{mod.guide}.md
              </code>{' '}
              rồi chạy <code className="font-mono font-bold">npm run manuals</code>.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
              <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Nội dung đổi theo phân hệ bạn đang mở. Sang phân hệ khác rồi bấm lại sẽ ra hướng dẫn
              của phân hệ đó.
            </p>
            <Blocks blocks={blocks} />
          </>
        )}
      </div>
    </Sheet>
  );
}
