import { AlertCircle, CheckCircle2 } from "lucide-react"

export function FormNotice({
  tone = "error",
  children,
}: {
  tone?: "error" | "success"
  children: React.ReactNode
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
        tone === "error" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"
      }`}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}
