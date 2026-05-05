"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { writeDemoSettings, DEFAULT_DEMO_SETTINGS } from "@/lib/demo/settings";

export function DangerZone() {
  const { clear: clearCatalog, items } = useDemoCatalog();
  const { push } = useToast();

  function clearAll() {
    if (
      !confirm(
        "Reset all demo data? This wipes your demo product catalog and settings from this browser. Cannot be undone.",
      )
    ) {
      return;
    }
    clearCatalog();
    writeDemoSettings(DEFAULT_DEMO_SETTINGS);
    push({
      kind: "warn",
      title: "Demo data reset",
      message:
        "Catalog cleared. Settings reset to defaults. Refresh to see the changes everywhere.",
    });
  }

  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)]/40 p-5">
      <h2 className="font-display text-lg text-[var(--color-danger-soft-fg)]">
        Danger zone
      </h2>
      <p className="mt-1 text-sm text-text/85">
        Wipe everything stored in this browser: settings + the demo catalog
        ({items.length} product{items.length === 1 ? "" : "s"}). Real Supabase
        data is unaffected (and not stored in this browser anyway).
      </p>
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="mt-3"
        onClick={clearAll}
      >
        Reset all demo data
      </Button>
    </div>
  );
}
