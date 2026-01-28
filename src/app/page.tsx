"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import styles from "./page.module.css";
import { CryptoChart } from "../components/CryptoChart";
import { subscribeCrypto } from "../utils/cryptoBroadcast";
import { getCookie } from "../utils/cookies";

function ChartContent() {
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const [cryptoFromSync, setCryptoFromSync] = useState(
    () => getCookie("crypto")?.toLowerCase() ?? "btc"
  );

  useEffect(() => {
    if (typeFromUrl != null) return;
    return subscribeCrypto((crypto) => {
      setCryptoFromSync((prev) => (crypto !== prev ? crypto : prev));
    });
  }, [typeFromUrl]);

  const crypto = typeFromUrl ?? cryptoFromSync;
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
