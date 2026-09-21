import "server-only"
import { recordMail } from "@/lib/tenant-directory"
import { MAIL_FROM_DEFAULT }

export async function sendOwnerCredentials(input: {
  to: string
  ownerName: string
  storeName: string
  temporaryPassword: string
  setPasswordUrl: string
  origin: string
}): Promise<{ delivered: boolean }> {
  const subject = `[K-EuroMart] ${input.storeName} 업주 계정이 발급되었습니다`
  const body = [
    `${input.ownerName} 님,`,
    "",
    `입점 서류 검토가 완료되어 '${input.storeName}' 업주 계정이 발급되었습니다.`,
    "",
    `로그인: ${input.origin}/vendor/login`,
    `이메일: ${input.to}`,
    `임시 비밀번호: ${input.temporaryPassword}`,
    "",
    `또는 비밀번호 설정 링크 (48시간): ${input.setPasswordUrl}`,
    "",
    "최초 로그인 후 반드시 본인 비밀번호로 변경해야 매장 관리를 사용할 수 있습니다.",
    "본부는 평문 비밀번호를 저장하지 않으며, 이 메일의 임시 비밀번호는 다시 조회할 수 없습니다.",
    "",
    "K-EuroMart 본부",
  ].join("\n")

  await recordMail(input.to, subject, body)

  const key = process.env.RESEND_API_KEY
  if (!key) return { delivered: false }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? MAIL_FROM_DEFAULT,
        to: [input.to],
        subject,
        text: body,
      }),
    })
    return { delivered: res.ok }
  } catch {
    return { delivered: false }
  }
}

export async function sendPasswordResetMail(input: {
  to: string
  resetUrl: string
  origin: string
}): Promise<void> {
  const subject = "[K-EuroMart] 업주 비밀번호 재설정"
  const body = [
    "비밀번호 재설정 요청이 있었습니다.",
    `링크 (2시간): ${input.resetUrl}`,
    `로그인: ${input.origin}/vendor/login`,
    "요청하지 않았다면 이 메일을 무시하세요.",
  ].join("\n")
  await recordMail(input.to, subject, body)
}
