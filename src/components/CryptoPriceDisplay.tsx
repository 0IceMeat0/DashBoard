"use client";

import { useCryptoPrice } from "../hooks/useCryptoPrice";
import styles from "./CryptoPriceDisplay.module.scss";

interface CryptoPriceDisplayProps {
  crypto: string;
  currency: string;
}

export const CryptoPriceDisplay = ({
  crypto,
  currency,
}: CryptoPriceDisplayProps) => {
  const { data, loading, error } = useCryptoPrice({ crypto, currency });

  const handleExternalClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = (e.currentTarget as HTMLAnchorElement).href;
    // открываем в новой вкладке, не даем доступ к window.opener
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Ошибка загрузки данных
          <div className={styles.errorDetail}>
            {error && `Ошибка: ${error}`}
            {!data && !error && "Данные не получены"}
          </div>
        </div>
      </div>
    );
  }

  const isPositive = data.price_change_24h > 0;
  const changeColor = isPositive ? styles.positive : styles.negative;

  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(data.current_price);

  const formattedChange = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(data.price_change_24h);

  const formattedChangePercent = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(data.price_change_percentage_24h);

  const lastUpdated = new Date(data.last_updated).toLocaleString("ru-RU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const quoteLabel = currency === "usd" ? "USDT" : currency.toUpperCase();

  return (
    <div className={styles.container}>
      <a
        href="https://www.bybit.com/invite?ref=22Q9WZ"
        className={styles.pair}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleExternalClick}
      >
        {data.symbol}/{quoteLabel}
      </a>

      <div className={styles.priceRow}>
        <span className={styles.price}>{formattedPrice}</span>
        <span className={`${styles.change} ${changeColor}`}>
          {formattedChange} ({formattedChangePercent}%)
        </span>
      </div>

      <div className={styles.footer}>
        <span className={styles.timestamp}>
          <a
            href="https://www.bybit.com/invite?ref=22Q9WZ"
            className={styles.bybit}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick}
          >
            BYBIT{" "}
          </a>
          {lastUpdated}
        </span>
      </div>
    </div>
  );
};
