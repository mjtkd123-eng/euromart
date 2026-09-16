import "server-only"

import type { CsLang, CsQuickReply, CsChatTurn, QuickReplyId } from "@/lib/cs-types"
import { matchFaq, buildFaqReply } from "@/lib/chatbot"
import { extractOrderId, getOrderStatus, type BoltOrderPhase, type OrderStatusResult } from "@/lib/order-status"

export type { CsLang, CsChatTurn, QuickReplyId, CsQuickReply }

const STATUS_LABEL: Record<CsLang, Record<BoltOrderPhase, string>> = {
  ko: {
    preparing: "상품 준비 중",
    rider_assigned: "라이더 배정 완료",
    delivering: "배송 중",
    completed: "완료",
  },
  en: {
    preparing: "preparing",
    rider_assigned: "rider assigned",
    delivering: "out for delivery",
    completed: "completed",
  },
  de: {
    preparing: "wird vorbereitet",
    rider_assigned: "Fahrer zugewiesen",
    delivering: "unterwegs",
    completed: "zugestellt",
  },
  cs: {
    preparing: "připravuje se",
    rider_assigned: "kurýr přiřazen",
    delivering: "na cestě",
    completed: "doručeno",
  },
  fr: {
    preparing: "en préparation",
    rider_assigned: "coursier assigné",
    delivering: "en livraison",
    completed: "livré",
  },
  hu: {
    preparing: "összekészítés alatt",
    rider_assigned: "futár kiosztva",
    delivering: "szállítás alatt",
    completed: "kiszállítva",
  },
}

const QUICK_LABEL: Record<CsLang, Record<QuickReplyId, string>> = {
  ko: {
    track: "1. 실시간 배송 조회",
    cancel: "2. 주문 취소/변경",
    missing: "3. 상품 누락/품절 안내",
    rider: "4. 볼트 기사 전용 문의",
    human: "5. 상담원 연결",
  },
  en: {
    track: "1. Live delivery tracking",
    cancel: "2. Cancel / change order",
    missing: "3. Missing / out of stock",
    rider: "4. Bolt rider help",
    human: "5. Talk to an agent",
  },
  de: {
    track: "1. Live-Sendungsverfolgung",
    cancel: "2. Stornieren / ändern",
    missing: "3. Fehlartikel / ausverkauft",
    rider: "4. Hilfe für Bolt-Fahrer",
    human: "5. Mitarbeiter verbinden",
  },
  cs: {
    track: "1. Sledování doručení",
    cancel: "2. Zrušit / změnit",
    missing: "3. Chybějící / vyprodané",
    rider: "4. Pomoc pro kurýra Bolt",
    human: "5. Spojit s operátorem",
  },
  fr: {
    track: "1. Suivi en direct",
    cancel: "2. Annuler / modifier",
    missing: "3. Manquant / rupture",
    rider: "4. Aide coursier Bolt",
    human: "5. Parler à un conseiller",
  },
  hu: {
    track: "1. Élő kiszállítás követése",
    cancel: "2. Lemondás / módosítás",
    missing: "3. Hiányzó / elfogyott",
    rider: "4. Bolt futár segítség",
    human: "5. Ügyintéző kapcsolása",
  },
}

function tmap(lang: CsLang, rows: Record<CsLang, string>): string {
  return rows[lang] ?? rows.en
}

function quickReplies(lang: CsLang): CsQuickReply[] {
  return (Object.keys(QUICK_LABEL.ko) as QuickReplyId[]).map((id) => ({
    id,
    label: QUICK_LABEL[lang][id],
  }))
}

export function detectCsLang(text: string, fallback: CsLang = "ko"): CsLang {
  if (/[가-힣]/.test(text)) return "ko"
  if (/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(text) && /\b(a|az|hogy|köszönöm|szállítás)\b/i.test(text)) return "hu"
  if (/[čďěňřšťůžČĎĚŇŘŠŤŮŽ]/.test(text)) return "cs"
  if (/\b(bitte|danke|lieferung|bestellung|fahrer)\b/i.test(text) || /[äöüß]/.test(text)) return "de"
  if (/\b(bonjour|merci|livraison|commande|s'il)\b/i.test(text) || /[àâçéèêëîïôùû]/i.test(text)) {
    if (/\b(bonjour|merci|livraison|commande)\b/i.test(text)) return "fr"
  }
  if (/\b(the|please|order|delivery|rider|refund|hello|hi)\b/i.test(text)) return "en"
  return fallback
}

function looksLikePii(text: string): boolean {
  if (/\b(?:\d[ -]*?){13,19}\b/.test(text)) return true
  if (/\bcvv?\b|\bcvc\b/i.test(text)) return true
  if (/비밀번호|password|passwd/i.test(text) && /\b\S{6,}\b/.test(text)) return true
  return false
}

function wantsHuman(text: string): boolean {
  return /상담원|상담사|사람\s*연결|담당자|agent|human|operator|mitarbeiter|operátor|conseiller|ügyintéző|분쟁|dispute|개인정보 수정|시스템 오류|system error/i.test(
    text,
  )
}

function intentFromText(text: string, quickId?: QuickReplyId): QuickReplyId | "faq" | "status" | "unknown" {
  if (quickId) return quickId
  const t = text.toLowerCase()
  if (wantsHuman(t) || t.includes("상담원 연결")) return "human"
  if (/기사|라이더|픽업 카운터|pickup counter|rider|fahrer|kurýr|coursier|futár/.test(t) && /볼트|bolt/.test(t)) {
    return "rider"
  }
  if (/누락|품절|파손|상했|missing|out of stock|damaged|spoiled/.test(t)) return "missing"
  if (/취소|변경|cancel|modify|storn/.test(t)) return "cancel"
  if (/배송 조회|어디|추적|track|status|상태|주문번호|order/.test(t)) return "track"
  return matchFaq(text) ? "faq" : "unknown"
}

function formatStatus(lang: CsLang, order: OrderStatusResult): string {
  const label = STATUS_LABEL[lang][order.status!]
  const id = order.orderId
  if (order.status === "delivering") {
    return tmap(lang, {
      ko: `주문번호 [${id}]의 현재 상태는 **[${label}]**입니다.\n볼트 라이더${order.riderName ? ` ${order.riderName}` : ""}님이 이동 중이며, 약 ${order.etaMinutes ?? 10}분 후 도착 예정입니다.`,
      en: `Order [${id}] is **[${label}]**.\nYour Bolt rider${order.riderName ? ` ${order.riderName}` : ""} is on the way — about ${order.etaMinutes ?? 10} minutes out.`,
      de: `Bestellung [${id}] ist **[${label}]**.\nDer Bolt-Fahrer${order.riderName ? ` ${order.riderName}` : ""} ist unterwegs, Ankunft in ca. ${order.etaMinutes ?? 10} Minuten.`,
      cs: `Objednávka [${id}] je **[${label}]**.\nKurýr Bolt${order.riderName ? ` ${order.riderName}` : ""} je na cestě, zhruba za ${order.etaMinutes ?? 10} minut.`,
      fr: `La commande [${id}] est **[${label}]**.\nLe coursier Bolt${order.riderName ? ` ${order.riderName}` : ""} arrive dans environ ${order.etaMinutes ?? 10} minutes.`,
      hu: `A(z) [${id}] rendelés állapota **[${label}]**.\nA Bolt futár${order.riderName ? ` (${order.riderName})` : ""} úton van, kb. ${order.etaMinutes ?? 10} perc múlva érkezik.`,
    })
  }
  if (order.status === "rider_assigned") {
    return tmap(lang, {
      ko: `주문번호 [${id}]의 현재 상태는 **[${label}]**입니다.\n라이더가 마트 볼트 전용 픽업 카운터로 향하고 있습니다. 예상 ${order.etaMinutes ?? 20}분입니다.`,
      en: `Order [${id}] is **[${label}]**.\nThe rider is heading to the Bolt pickup counter. ETA about ${order.etaMinutes ?? 20} minutes.`,
      de: `Bestellung [${id}] ist **[${label}]**.\nDer Fahrer fährt zum Bolt-Abholschalter. Ca. ${order.etaMinutes ?? 20} Minuten.`,
      cs: `Objednávka [${id}] je **[${label}]**.\nKurýr jede k přepážce Bolt. Přibližně ${order.etaMinutes ?? 20} minut.`,
      fr: `La commande [${id}] est **[${label}]**.\nLe coursier se rend au comptoir Bolt. Environ ${order.etaMinutes ?? 20} minutes.`,
      hu: `A(z) [${id}] rendelés **[${label}]**.\nA futár a Bolt átvevő pult felé tart. Kb. ${order.etaMinutes ?? 20} perc.`,
    })
  }
  if (order.status === "preparing") {
    return tmap(lang, {
      ko: `주문번호 [${id}]의 현재 상태는 **[${label}]**입니다.\n이 단계에서는 앱에서 즉시 취소할 수 있습니다.`,
      en: `Order [${id}] is **[${label}]**.\nYou can still cancel it in the app.`,
      de: `Bestellung [${id}] ist **[${label}]**.\nStornierung in der App ist noch möglich.`,
      cs: `Objednávka [${id}] je **[${label}]**.\nZrušení v aplikaci je stále možné.`,
      fr: `La commande [${id}] est **[${label}]**.\nVous pouvez encore l’annuler dans l’app.`,
      hu: `A(z) [${id}] rendelés **[${label}]**.\nAz appban még lemondható.`,
    })
  }
  return tmap(lang, {
    ko: `주문번호 [${id}]의 현재 상태는 **[${label}]**입니다.\n배달이 완료되었습니다.`,
    en: `Order [${id}] is **[${label}]**.\nThe delivery is done.`,
    de: `Bestellung [${id}] ist **[${label}]**.\nDie Lieferung ist abgeschlossen.`,
    cs: `Objednávka [${id}] je **[${label}]**.\nDoručení je dokončeno.`,
    fr: `La commande [${id}] est **[${label}]**.\nLa livraison est terminée.`,
    hu: `A(z) [${id}] rendelés **[${label}]**.\nA kiszállítás kész.`,
  })
}

function askOrderId(lang: CsLang): string {
  return tmap(lang, {
    ko: "실시간 조회를 위해 주문번호를 알려 주세요.\n데모는 KEM-12345, KEM-8888, KEM-7777, KEM-1001로 확인할 수 있습니다.",
    en: "Please send your order number so I can look it up.\nDemo IDs: KEM-12345, KEM-8888, KEM-7777, KEM-1001.",
    de: "Bitte nennen Sie die Bestellnummer.\nDemo: KEM-12345, KEM-8888, KEM-7777, KEM-1001.",
    cs: "Prosím pošlete číslo objednávky.\nDemo: KEM-12345, KEM-8888, KEM-7777, KEM-1001.",
    fr: "Indiquez le numéro de commande.\nDémo : KEM-12345, KEM-8888, KEM-7777, KEM-1001.",
    hu: "Kérem a rendelési számot.\nDemó: KEM-12345, KEM-8888, KEM-7777, KEM-1001.",
  })
}

function notFound(lang: CsLang, id: string): string {
  return tmap(lang, {
    ko: `주문번호 [${id}]를 찾지 못했습니다.\n번호를 다시 확인해 주시거나 [상담원 연결]을 이용해 주세요. 데모 번호: KEM-12345.`,
    en: `I couldn’t find order [${id}].\nPlease check the number, or tap Talk to an agent. Demo: KEM-12345.`,
    de: `Bestellung [${id}] wurde nicht gefunden.\nNummer prüfen oder Mitarbeiter verbinden. Demo: KEM-12345.`,
    cs: `Objednávku [${id}] jsem nenašel.\nZkontrolujte číslo, nebo spojte operátora. Demo: KEM-12345.`,
    fr: `Commande [${id}] introuvable.\nVérifiez le numéro ou parlez à un conseiller. Démo : KEM-12345.`,
    hu: `A(z) [${id}] rendelést nem találom.\nEllenőrizze a számot, vagy kérjen ügyintézőt. Demó: KEM-12345.`,
  })
}

const COPY = {
  greet: {
    ko: "안녕하세요. K-EuroMart × Bolt 1:1 상담입니다.\n배송 조회, 취소, 품절·누락, 라이더 문의를 바로 도와드릴게요.",
    en: "Hi — this is K-EuroMart × Bolt support.\nI can track a delivery, explain cancel rules, missing items, or rider pickup.",
    de: "Hallo, hier ist K-EuroMart × Bolt Support.\nIch helfe bei Sendungsverfolgung, Storno, Fehlartikeln und Fahrerfragen.",
    cs: "Dobrý den, tady K-EuroMart × Bolt podpora.\nPomohu se sledováním, stornem, chybějícím zbožím i kurýrem.",
    fr: "Bonjour, support K-EuroMart × Bolt.\nJe peux suivre une commande, expliquer l’annulation, les manquants ou aider un coursier.",
    hu: "Üdvözlöm, a K-EuroMart × Bolt ügyfélszolgálat vagyok.\nSegítek követésben, lemondásban, hiányzó termékben vagy futárkérdésben.",
  },
  pii: {
    ko: "카드번호·CVC·비밀번호는 받지 않습니다.\n해당 정보는 지운 뒤 주문번호만 남겨 주세요.",
    en: "Please don’t send card numbers, CVC, or passwords.\nRemove those details and share only the order number.",
    de: "Bitte keine Kartennummern, CVC oder Passwörter senden.",
    cs: "Neposílejte čísla karet, CVC ani hesla.",
    fr: "N’envoyez pas de numéro de carte, CVC ou mot de passe.",
    hu: "Kártyaszámot, CVC-t és jelszót ne küldjön.",
  },
  human: {
    ko: "해당 문의는 상세 확인이 필요합니다.\n아래 [상담원 연결] 버튼을 눌러 주시거나 주문번호를 입력해 주시면 담당자에게 연결해 드리겠습니다.",
    en: "This needs a specialist.\nTap Talk to an agent below, or send your order number and we’ll connect you.",
    de: "Das braucht einen Mitarbeiter.\nBitte „Mitarbeiter verbinden“ tippen oder die Bestellnummer senden.",
    cs: "Toto musí vyřídit operátor.\nKlepněte na Spojit s operátorem, nebo pošlete číslo objednávky.",
    fr: "Un conseiller doit vérifier cela.\nAppuyez sur Parler à un conseiller, ou envoyez le numéro de commande.",
    hu: "Ezt ügyintézőnek kell megnéznie.\nNyomja meg az Ügyintéző kapcsolása gombot, vagy küldje a rendelési számot.",
  },
  cancel: {
    ko: "'상품 준비 중'이면 앱에서 바로 취소할 수 있습니다.\n'배송 중'은 취소가 불가하며, 변심 반품 시 왕복 배송비는 고객 부담입니다.",
    en: "While the store is preparing, cancel in the app.\nOnce out for delivery you can’t cancel; a change-of-mind return is charged both ways.",
    de: "Während der Vorbereitung können Sie in der App stornieren.\nUnterwegs ist Storno nicht möglich; bei Meinungsänderung zahlen Sie Hin- und Rückversand.",
    cs: "Ve stavu přípravy lze objednávku v aplikaci zrušit.\nNa cestě už storno nejde; při změně názoru hradíte dopravu oběma směry.",
    fr: "En préparation, annulez dans l’app.\nEn livraison, l’annulation est impossible ; un retour pour changement d’avis est facturé aller-retour.",
    hu: "Összekészítés alatt az appban lemondható.\nSzállítás közben nem; meggondolásos visszaküldésnél az oda-vissza díj a vásárlót terheli.",
  },
  missing: {
    ko: "품절이면 동의한 대체 상품을 보내거나 해당 금액을 부분 취소합니다.\n누락·파손은 주문번호와 사진을 확인한 뒤 상담원이 접수합니다. [상담원 연결]을 눌러 주세요.",
    en: "If an item is out of stock we send an agreed substitute or refund that line.\nMissing or damaged goods need the order number and photos — tap Talk to an agent.",
    de: "Bei Ausverkauf senden wir einen vereinbarten Ersatz oder erstatten die Position.\nFehlartikel/Beschädigung: Bestellnummer und Fotos, dann Mitarbeiter.",
    cs: "Při vyprodání pošleme domluvenou náhradu, nebo částku vrátíme.\nChybějící/poškozené zboží: číslo objednávky a fotky — spojte operátora.",
    fr: "En rupture, nous envoyons un substitut convenu ou remboursons la ligne.\nManquant/cassé : numéro et photos, puis un conseiller.",
    hu: "Elfogyásnál egyeztetett cserét küldünk, vagy a tételt jóváírjuk.\nHiány/sérülés: rendelési szám és fotó után ügyintéző.",
  },
  rider: {
    ko: "픽업은 마트 안 **볼트 전용 픽업 카운터**를 이용해 주세요.\n고객 부재 시 전화 2회 후 미수신이면 문 앞에 두고 볼트 앱에 사진을 등록한 뒤 완료 처리합니다.",
    en: "Pick up at the in-store **Bolt pickup counter**.\nIf the customer doesn’t answer two calls, leave at the door, upload a photo in Bolt, then complete.",
    de: "Abholung am **Bolt-Abholschalter** im Markt.\nNach 2 unbeantworteten Anrufen vor die Tür stellen, Foto in der Bolt-App, dann abschließen.",
    cs: "Vyzvednutí u **přepážky Bolt** v obchodě.\nPo 2 nezvednutých hovorech nechte u dveří, nahrajte foto v Bolt a dokončete.",
    fr: "Retrait au **comptoir Bolt** du magasin.\nAprès 2 appels sans réponse, déposez à la porte, photo dans Bolt, puis terminez.",
    hu: "Átvétel a bolti **Bolt átvevő pultnál**.\nKét sikertelen hívás után az ajtó elé, fotó a Bolt appba, majd készre jelölés.",
  },
  unknown: {
    ko: "운영 정책에 없는 내용은 안내할 수 없습니다.\n아래 퀵 리플라이를 고르시거나 [상담원 연결]을 이용해 주세요.",
    en: "I can only answer from our published policy.\nPick a quick reply below, or talk to an agent.",
    de: "Ich antworte nur nach der veröffentlichten Richtlinie.\nSchnellantwort wählen oder Mitarbeiter verbinden.",
    cs: "Odpovídám jen podle zveřejněných pravidel.\nVyberte rychlou odpověď, nebo operátora.",
    fr: "Je m’en tiens à la politique publiée.\nChoisissez une réponse rapide ou un conseiller.",
    hu: "Csak a közzétett szabályok alapján válaszolok.\nVálasszon gyorsválaszt, vagy ügyintézőt.",
  },
} as const

export function welcomeMessage(lang: CsLang): CsChatTurn {
  return {
    reply: COPY.greet[lang] ?? COPY.greet.en,
    lang,
    quickReplies: quickReplies(lang),
    escalate: false,
    waitingForOrderId: false,
    lastOrderId: null,
  }
}

export async function replyToCustomer(input: {
  message: string
  quickReplyId?: QuickReplyId
  lastOrderId?: string | null
  langHint?: CsLang
}): Promise<CsChatTurn> {
  const lang = detectCsLang(input.message, input.langHint ?? "ko")
  const text = input.message.trim()
  const replies = quickReplies(lang)

  const turn = (
    reply: string,
    extra: Partial<CsChatTurn> = {},
  ): CsChatTurn => ({
    reply,
    lang,
    quickReplies: replies,
    escalate: false,
    waitingForOrderId: false,
    lastOrderId: input.lastOrderId ?? null,
    ...extra,
  })

  if (looksLikePii(text)) {
    return turn(COPY.pii[lang] ?? COPY.pii.en)
  }

  const extracted = extractOrderId(text)
  const orderId = extracted || (input.quickReplyId === "track" ? null : input.lastOrderId) || null
  const kind = intentFromText(text, input.quickReplyId)

  if (kind === "human") {
    return turn(COPY.human[lang] ?? COPY.human.en, { escalate: true })
  }

  if (kind === "track" || extracted) {
    const id = extracted || input.lastOrderId
    if (!id) {
      return turn(askOrderId(lang), { waitingForOrderId: true })
    }
    const order = await getOrderStatus(id)
    if (!order.found || !order.status) {
      return turn(notFound(lang, order.orderId), { lastOrderId: null })
    }
    return turn(formatStatus(lang, order), { lastOrderId: order.orderId, order })
  }

  if (kind === "cancel") {
    return turn(COPY.cancel[lang] ?? COPY.cancel.en)
  }
  if (kind === "missing") {
    return turn(COPY.missing[lang] ?? COPY.missing.en, { escalate: true })
  }
  if (kind === "rider") {
    return turn(COPY.rider[lang] ?? COPY.rider.en)
  }

  const faq = matchFaq(text)
  if (faq) {
    const faqLang = lang === "ko" ? "ko" : "en"
    return turn(buildFaqReply(faq, faqLang), { escalate: faq.status !== "ready" })
  }

  if (orderId) {
    const order = await getOrderStatus(orderId)
    if (order.found && order.status) {
      return turn(formatStatus(lang, order), { lastOrderId: order.orderId, order })
    }
  }

  return turn(COPY.unknown[lang] ?? COPY.unknown.en)
}
