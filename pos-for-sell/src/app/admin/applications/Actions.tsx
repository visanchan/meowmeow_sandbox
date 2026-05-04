"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ApproveRejectButtons({
  applicationId,
}: {
  applicationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const { push } = useToast();

  function approve() {
    startTransition(async () => {
      // DD-26 will call the real server action.
      await fakeDelay();
      setDone("approved");
      push({
        kind: "success",
        title: "Approved (mock)",
        message: `Application ${applicationId.slice(0, 8)}… → invite code generated.`,
      });
    });
  }

  function reject() {
    startTransition(async () => {
      await fakeDelay();
      setDone("rejected");
      push({
        kind: "info",
        title: "Rejected (mock)",
        message: `Application ${applicationId.slice(0, 8)}… → status set to rejected.`,
      });
    });
  }

  if (done) {
    return (
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {done}
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={approve}
        loading={pending}
      >
        Approve
      </Button>
      <Button variant="danger" size="sm" onClick={reject} loading={pending}>
        Reject
      </Button>
    </div>
  );
}

function fakeDelay(ms: number = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
