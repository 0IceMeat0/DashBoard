"use client";

import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { CryptoChart } from "../components/CryptoChart";

function ChartContent() {
  const searchParams = useSearchParams();

  // Получаем параметры из URL или используем значения по умолчанию
  const crypto = searchParams.get("type") ?? "btc";
  const currency = searchParams.get("money") ?? "usd";

  return <CryptoChart crypto={crypto} currency={currency} />;
}

export default function Home() {
  return (
    <div className={styles.page}>
      <ChartContent />
    </div>
  );
}
