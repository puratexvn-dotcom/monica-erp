import type { ReactNode } from 'react';

import { AssignmentQueryProvider } from './providers';

// ============================================================================
// Ranh giới của React Query trong MONICA MOS.
//
// Mọi thứ BÊN TRONG nhánh này dùng React Query. Mọi thứ BÊN NGOÀI giữ nguyên
// khuôn hook tự viết của Phase 2–6 — không một tệp nào bị đụng tới.
// ============================================================================

export default function AssignmentsLayout({ children }: { children: ReactNode }) {
  return <AssignmentQueryProvider>{children}</AssignmentQueryProvider>;
}
