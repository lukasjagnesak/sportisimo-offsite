"use client";

import { useActionState, useState } from "react";
import { acceptOfferAction, rejectOfferAction } from "@/lib/actions/jobs";
import { idle } from "@/lib/actions/types";
import { Alert, Button } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { FEES, FLAGS } from "@/lib/fees";
import { formatCzk } from "@/lib/format";

export function OfferActions({
  offerId,
  cleanerName,
  disabled,
}: {
  offerId: string;
  cleanerName: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(acceptOfferAction, idle);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-5 border-t border-ink-100 pt-4">
      {state.error && (
        <div className="mb-3">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}

      {confirming ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="offerId" value={offerId} />
          <p className="text-sm text-ink-700">
            Vybíráte <strong>{cleanerName}</strong>.{" "}
            {FLAGS.REQUIRE_CONNECTION_FEE
              ? `Z uložené karty strhneme ${formatCzk(FEES.CONNECTION_FEE)} a hned se vám odemkne kontakt, chat i kalendář.`
              : "Hned se vám odemkne kontakt, chat i kalendář."}{" "}
            Ostatní nabídky se tím uzavřou.
          </p>
          <div className="flex flex-wrap gap-2">
            <SubmitButton pendingLabel="Zpracovávám platbu…">
              {FLAGS.REQUIRE_CONNECTION_FEE
                ? `Zaplatit ${formatCzk(FEES.CONNECTION_FEE)} a propojit`
                : "Potvrdit výběr"}
            </SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Zpět
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setConfirming(true)} disabled={disabled}>
            Vybrat a propojit
          </Button>
          <form action={rejectOfferAction}>
            <input type="hidden" name="offerId" value={offerId} />
            <Button type="submit" variant="ghost">
              Odmítnout
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
