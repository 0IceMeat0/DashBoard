"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import styles from "./page.module.css";
import { CryptoChart } from "../components/CryptoChart";
import { subscribeCrypto } from "../utils/cryptoBroadcast";
import { getCookie, setCookie } from "../utils/cookies";

function getInitialCrypto(typeFromUrl: string | null): string {
  if (typeof window === "undefined") {
    return typeFromUrl?.toLowerCase() ?? getCookie("crypto")?.toLowerCase() ?? "btc";
  }
  const typeVal = typeFromUrl?.toLowerCase();
  if (typeVal) return typeVal;
  return getCookie("crypto")?.toLowerCase() ?? "btc";
}

function ChartContent() {
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const timeOne = searchParams.get("time") === "one";
  const [crypto, setCrypto] = useState(() =>
    getInitialCrypto(typeFromUrl)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("time") === "one" ? params.get("type") : null;
    if (t?.trim()) setCookie("crypto", t.trim().toUpperCase());
  }, [timeOne, typeFromUrl]);

  useEffect(() => {
    if (typeFromUrl) return;
    return subscribeCrypto((c) => {
      setCrypto((prev) => (c !== prev ? c : prev));
    });
  }, [typeFromUrl]);

  const currency = searchParams.get("money") ?? "usd";

  return <CryptoChart crypto={crypto} currency={currency} />;
}

export default function Home() {
  return (
    <div className={styles.page}>
      <Suspense>
        <ChartContent />
      </Suspense>
    </div>
  );
}
