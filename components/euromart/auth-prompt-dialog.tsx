"use client"

import Link from "next/link"
import { ClipboardList, MapPin, ShoppingBag, UserPlus } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * 로그인 버튼을 눌렀을 때 열리는 안내 모달.
 * 곧바로 로그인 폼으로 보내는 대신, 계정을 만들면 얻는 이점을 먼저 보여주고
 * 회원가입을 주요 동작으로 제시합니다.
 */
export function AuthPromptDialog() {
  const { authPromptOpen, setAuthPromptOpen, setSignUpOpen, region, t, storeName } = useEuromart()

  const perks = [
    { icon: ClipboardList, label: t("authPerkOrders") },
    { icon: MapPin, label: t("authPerkAddress") },
    { icon: ShoppingBag, label: t("authPerkCart") },
  ]

  return (
    <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <span className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="break-keep text-balance text-xl font-black">
            {t("authModalTitle", { store: storeName(region) })}
          </DialogTitle>
          <DialogDescription className="break-keep text-pretty leading-relaxed">
            {t("authModalSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <ul role="list" className="flex flex-col gap-2.5 py-1">
          {perks.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="break-keep text-sm font-medium text-foreground">{label}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-11 w-full rounded-full text-base"
            onClick={() => {
              setAuthPromptOpen(false)
              setSignUpOpen(true)
            }}
          >
            {t("createAccount")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("alreadyMember")}{" "}
            <Link
              href="/auth/login"
              onClick={() => setAuthPromptOpen(false)}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("login")}
            </Link>
          </p>
          <Button
            variant="ghost"
            className="mt-1 h-10 rounded-full text-sm text-muted-foreground"
            onClick={() => setAuthPromptOpen(false)}
          >
            {t("continueAsGuest")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
