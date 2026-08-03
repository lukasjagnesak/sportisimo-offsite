"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction } from "@/lib/actions/profile";
import { idle } from "@/lib/actions/types";
import { Alert, Card, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { timeAgo } from "@/lib/format";

type Message = {
  id: string;
  body: string;
  createdAt: Date;
  sender: { id: string; firstName: string; lastName: string };
};

export function Chat({
  conversationId,
  messages,
  currentUserId,
}: {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
}) {
  const [state, formAction] = useActionState(sendMessageAction, idle);
  const formRef = useRef<HTMLFormElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Po odeslání vyprázdnit pole a sjet na konec vlákna.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  return (
    <Card className="flex flex-col p-6">
      <h2 className="font-semibold text-ink-900">Zprávy</h2>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-ink-600">
            Zatím tu nic není. Napište první zprávu a domluvte se na detailech.
          </p>
        )}

        {messages.map((message) => {
          const mine = message.sender.id === currentUserId;
          return (
            <div key={message.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cx(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  mine ? "bg-ink-700 text-white" : "bg-ink-50 text-ink-900",
                )}
              >
                <p className="whitespace-pre-line">{message.body}</p>
                <p className={cx("mt-1 text-xs", mine ? "text-ink-200" : "text-ink-500")}>
                  {message.sender.firstName} · {timeAgo(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="conversationId" value={conversationId} />
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <textarea
          name="body"
          rows={3}
          required
          maxLength={4000}
          className="field-input"
          placeholder="Napište zprávu…"
        />
        <SubmitButton size="sm" pendingLabel="Odesílám…">
          Odeslat
        </SubmitButton>
      </form>
    </Card>
  );
}
