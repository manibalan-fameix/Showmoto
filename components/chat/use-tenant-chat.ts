"use client"

import { useCallback, useRef, useState } from "react"

import { copy } from "@/lib/copy"

const t = copy.tenant.chat

export type ChatScope = { type: "general" } | { type: "car"; carSlug: string }
export type ChatUiMessage = { id: string; role: "user" | "assistant"; content: string }
export type ChatStatus = "idle" | "sending" | "error"

/** Streams replies from /api/t/chat as plain text chunks and keeps the visible transcript in sync. */
export function useTenantChat(scope: ChatScope, greeting: string) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([{ id: "greeting", role: "assistant", content: greeting }])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const idRef = useRef(0)
  const nextId = () => `m${++idRef.current}`

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || status === "sending") return

      const userMessage: ChatUiMessage = { id: nextId(), role: "user", content: trimmed }
      const assistantId = nextId()
      let history: { role: "user" | "assistant"; content: string }[] = []

      setMessages((prev) => {
        history = [...prev, userMessage].filter((m) => m.id !== "greeting").map((m) => ({ role: m.role, content: m.content }))
        return [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]
      })
      setStatus("sending")

      const fail = (message: string) => {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: message } : m)))
        setStatus("error")
      }

      try {
        const res = await fetch("/api/t/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carSlug: scope.type === "car" ? scope.carSlug : undefined, messages: history }),
        })

        if (!res.ok || !res.body) {
          fail(res.status === 429 ? t.rateLimited : res.status === 503 ? t.unavailable : t.error)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let text = ""
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m)))
        }
        setStatus("idle")
      } catch {
        fail(t.error)
      }
    },
    [scope, status],
  )

  return { messages, status, send }
}
