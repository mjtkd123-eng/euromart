"use client"

import { useState, useTransition } from "react"
import { UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FormNotice } from "@/components/vendor/form-notice"
import { updateUserRole } from "@/app/actions/admin"
import type { AdminUser } from "@/lib/admin-server"

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  customer: "고객",
  vendor: "판매자",
  admin: "관리자",
}

export function UsersManager({ users, selfId }: { users: AdminUser[]; selfId: string }) {
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function changeRole(userId: string, role: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await updateUserRole(userId, role)
      if (res.ok) setNotice({ tone: "success", text: "역할이 변경되었습니다." })
      else setNotice({ tone: "error", text: res.error ?? "변경에 실패했습니다." })
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        사용자 역할을 변경합니다. 판매자로 지정한 뒤 지역 탭에서 매장을 배정하세요.
      </p>

      {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}

      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <UserRound className="size-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-foreground">{u.email}</p>
                  {u.id === selfId && (
                    <Badge variant="outline" className="text-[10px]">
                      나
                    </Badge>
                  )}
                  {u.assignedRegion && (
                    <Badge variant="secondary" className="text-[10px]">
                      {u.assignedRegion}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {u.fullName || "이름 미등록"} · 현재 {ROLE_LABEL[u.role]}
                </p>
              </div>

              <select
                aria-label={`${u.email} 역할`}
                value={u.role}
                disabled={pending || (u.id === selfId)}
                onChange={(e) => changeRole(u.id, e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground disabled:opacity-60"
              >
                <option value="customer">고객</option>
                <option value="vendor">판매자</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
