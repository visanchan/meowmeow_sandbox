"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMO_CLOSE_DAY_KEY,
  appendCloseDay,
  clearDemoCloseDay,
  readDemoCloseDay,
  type DemoCloseDayRecord,
} from "./close-day";

export function useDemoCloseDay(): {
  records: DemoCloseDayRecord[];
  ready: boolean;
  append: (record: DemoCloseDayRecord) => void;
  clear: () => void;
} {
  const [records, setRecords] = useState<DemoCloseDayRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecords(readDemoCloseDay());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === DEMO_CLOSE_DAY_KEY) {
        setRecords(readDemoCloseDay());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const append = useCallback((r: DemoCloseDayRecord) => {
    appendCloseDay(r);
    setRecords(readDemoCloseDay());
  }, []);

  const clear = useCallback(() => {
    clearDemoCloseDay();
    setRecords([]);
  }, []);

  return { records, ready, append, clear };
}
