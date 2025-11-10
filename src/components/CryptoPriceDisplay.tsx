"use client";

import { useCryptoPrice } from "../hooks/useCryptoPrice";
import styles from "./CryptoPriceDisplay.module.scss";

type OverridePriceData = {
  changeValue?: number;
  changePercent?: number;
  periodLabel?: string;
  lastUpdated?: number;
  isLoading?: boolean;
  usePeriodChange?: boolean;
};

interface CryptoPriceDisplayProps {
  crypto: string;
  currency: string;
  overrideData?: OverridePriceData;
}

export const CryptoPriceDisplay = ({
  crypto,
  currency,
  overrideData,
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

  const usePeriodChange = overrideData?.usePeriodChange ?? false;
  const showSpinner = usePeriodChange && overrideData?.isLoading;

  const overrideHasValues =
    overrideData?.changeValue !== undefined &&
    overrideData?.changePercent !== undefined;

  const useOverrideValues = usePeriodChange && overrideHasValues;

  const priceSource = data.current_price;
  const changeValueSource = useOverrideValues
    ? overrideData.changeValue!
    : data.price_change_24h;
  const changePercentSource = useOverrideValues
    ? overrideData.changePercent!
    : data.price_change_percentage_24h;
  const lastUpdatedSource = overrideData?.lastUpdated
    ? new Date(overrideData.lastUpdated)
    : new Date(data.last_updated);

  const isPositive = useOverrideValues
    ? changeValueSource >= 0
    : data.price_change_24h >= 0;
  const changeColor = isPositive ? styles.positive : styles.negative;

  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceSource);

  const formattedChange = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(changeValueSource);

  const formattedChangePercent = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(changePercentSource);



  const periodSuffix = useOverrideValues && overrideData?.periodLabel && !showSpinner
    ? `за ${overrideData.periodLabel}`
    : undefined;

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
        {showSpinner ? (
          <span className={styles.changeLoading}>
            <span className={styles.spinnerSmall}></span>
          </span>
        ) : (
          <span className={`${styles.change} ${changeColor}`}>
            {formattedChange} ({formattedChangePercent}%){" "}
            {periodSuffix && (
              <span className={styles.periodLabel}>{periodSuffix}</span>
            )}
          </span>
        )}
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
            BYBIT
          </a>
        </span>
      </div>
    </div>
  );
};
