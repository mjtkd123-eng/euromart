import { jsonError, jsonOk } from "@/lib/api"
import { replyToCustomer, welcomeMessage } from "@/lib/cs-agent"
import type { CsLang, QuickReplyId } from "@/lib/cs-types"

export const dynamic = "force-dynamic"

type Body = {
  message?: string
  quickReplyId?: QuickReplyId
  lastOrderId?: string | null
  lang?: CsLang
  start?: boolean
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError("Invalid JSON body")
  }

  const lang = body.lang ?? "ko"

  if (body.start || !body.message?.trim()) {
    return jsonOk(welcomeMessage(lang))
  }

  const turn = await replyToCustomer({
    message: body.message,
    quickReplyId: body.quickReplyId,
    lastOrderId: body.lastOrderId,
    langHint: lang,
  })

  return jsonOk(turn)
}
