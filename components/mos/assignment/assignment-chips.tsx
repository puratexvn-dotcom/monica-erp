'use client';

import {
  AlertTriangle, Ban, CheckCircle2, Circle, Clock, FileEdit,
  PauseCircle, PlayCircle, Send, ThumbsDown, type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import type { AssignmentPriority, AssignmentStatus } from '@/lib/mos/domain/assignment';
import type { ReportStatus } from '@/lib/mos/calculators/report-status.calculator';

import { PRIORITY_TONE, REPORT_TONE, STATUS_TONE, shouldShowPriority } from './tone';

// ============================================================================
// PHÙ HIỆU TRẠNG THÁI
//
// ⚠️ MỖI TRẠNG THÁI CÓ ICON RIÊNG, và đó không phải trang trí. Chuẩn UI:
// *"trạng thái luôn có icon + chữ, không phân biệt bằng màu đơn thuần"* —
// khoảng 8% nam giới bị rối loạn sắc giác, và `ACCEPTED` với `IN_PROGRESS` cùng
// màu xanh thì chỉ icon mới tách được hai cái.
//
// ⚠️ Chữ lấy từ TỪ ĐIỂN, không viết cứng. Điều XXI — phân hệ này có Portal đối
// tác nước ngoài trong lộ trình, và một nhãn tiếng Việt viết cứng hôm nay là
// một chỗ phải đi sửa lại sau.
// ============================================================================

const STATUS_ICON: Record<AssignmentStatus, LucideIcon> = {
  DRAFT: FileEdit,
  ISSUED: Send,
  ACCEPTED: CheckCircle2,
  REJECTED: ThumbsDown,
  IN_PROGRESS: PlayCircle,
  SUSPENDED: PauseCircle,
  COMPLETED: CheckCircle2,
  CLOSED: CheckCircle2,
  CANCELLED: Ban,
};

export function AssignmentStatusChip({ status }: { status: AssignmentStatus }) {
  const { t } = useLanguage();
  return (
    <Badge tone={STATUS_TONE[status]} icon={STATUS_ICON[status]}>
      {t(`asg_status_${status}` as DictionaryKey)}
    </Badge>
  );
}

export function AssignmentPriorityChip({ priority }: { priority: AssignmentPriority }) {
  const { t } = useLanguage();
  // Ưu tiên bình thường KHÔNG hiện chip: mọi dòng đều có màu thì không dòng nào
  // nổi bật, và cột độ ưu tiên mất hết tác dụng.
  if (!shouldShowPriority(priority)) return null;
  return (
    <Badge tone={PRIORITY_TONE[priority]} icon={AlertTriangle}>
      {t(`asg_prio_${priority}` as DictionaryKey)}
    </Badge>
  );
}

const REPORT_ICON: Record<ReportStatus, LucideIcon> = {
  COMPLETE: CheckCircle2,
  PARTIAL: Clock,
  OVERDUE: AlertTriangle,
  NOT_STARTED: Circle,
};

export function ReportStatusChip({ status }: { status: ReportStatus }) {
  const { t } = useLanguage();
  return (
    <Badge tone={REPORT_TONE[status]} icon={REPORT_ICON[status]}>
      {t(`asg_rep_${status}` as DictionaryKey)}
    </Badge>
  );
}
