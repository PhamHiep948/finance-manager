import { useCallback, useEffect, useState } from "react";
import { listImports } from "../services/importService";

/** Lịch sử các lô import (trang đầu, mới nhất trước). */
export function useImports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listImports({ pageSize: 50 })
      .then((res) => !cancelled && setItems(res.items))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { items, loading, error, refresh };
}
