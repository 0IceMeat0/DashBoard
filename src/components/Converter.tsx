"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCryptoPrice } from "../hooks/useCryptoPrice";
import { FIAT_OPTIONS } from "../services/cryptoService";
import { broadcastCrypto } from "../utils/cryptoBroadcast";
import { getCookie, setCookie } from "../utils/cookies";
import { getCryptoIconUrl } from "../utils/cryptoIcons";
import { CoinSelector } from "./CoinSelector";
import { CurrencySelector } from "./CurrencySelector";
import styles from "./Converter.module.scss";

type Direction = "cryptoToFiat" | "fiatToCrypto";

const defaultCrypto = "BTC";
const defaultFiat = "rub";

function formatFiat(value: number, fiatCode: string): string {
  const opt = FIAT_OPTIONS.find((f) => f.code === fiatCode);
  const symbol = opt?.symbol ?? fiatCode.toUpperCase();
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + " " + symbol + " " + fiatCode.toUpperCase();
}

function formatCrypto(value: number, decimals = 8): string {
  if (value >= 1) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  }
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

interface ConverterProps {
  /** Начальная криптовалюта из URL (?type=eth) */
  initialCrypto?: string;
}

export function Converter({ initialCrypto }: ConverterProps) {
  const [direction, setDirection] = useState<Direction>("cryptoToFiat");
  const [crypto, setCrypto] = useState(
    (initialCrypto?.trim().toUpperCase() || defaultCrypto).slice(0, 10)
  );
  const [fiat, setFiat] = useState(defaultFiat);
  const [fromAmount, setFromAmount] = useState("1");
  const [coinModalOpen, setCoinModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

  useEffect(() => {
    if (!initialCrypto) {
      const fromCookie = getCookie("crypto")?.trim().toUpperCase();
      if (fromCookie) setCrypto(fromCookie.slice(0, 10));
    }
  }, [initialCrypto]);

  useEffect(() => {
    setCookie("crypto", crypto);
    broadcastCrypto(crypto);
  }, [crypto]);

  const { data: priceData, loading } = useCryptoPrice({
    crypto,
    currency: fiat,
    autoRefresh: true,
    refreshInterval: 60000,
  });

  const rate = priceData?.current_price ?? null;

  const fromIsCrypto = direction === "cryptoToFiat";
  const toIsCrypto = !fromIsCrypto;

  const toAmount = useMemo(() => {
    const num = parseFloat(fromAmount.replace(",", "."));
    if (!Number.isFinite(num) || num < 0 || rate === null || !isFinite(rate))
      return "";
    if (direction === "cryptoToFiat") return num * rate;
    return num / rate;
  }, [fromAmount, rate, direction]);

  const rateLabel = useMemo(() => {
    if (rate === null || !isFinite(rate)) return null;
    const fiatOpt = FIAT_OPTIONS.find((f) => f.code === fiat);
    const sym = fiatOpt?.symbol ?? fiat.toUpperCase();
    const formatted = new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rate);
    return `1 ${crypto} = ${formatted} ${sym} ${fiat.toUpperCase()}`;
  }, [crypto, fiat, rate]);

  const handleSwap = useCallback(() => {
    setDirection((d) => (d === "cryptoToFiat" ? "fiatToCrypto" : "cryptoToFiat"));
    if (typeof toAmount === "number" && Number.isFinite(toAmount)) {
      const nextFrom = toIsCrypto
        ? (toAmount >= 1 ? toAmount.toFixed(2) : toAmount.toFixed(8).replace(/\.?0+$/, ""))
        : toAmount.toFixed(2);
      setFromAmount(nextFrom);
    }
  }, [toAmount, toIsCrypto]);

  const fromDisplayValue = fromAmount;
  const toDisplayValue =
    toAmount === ""
      ? ""
      : typeof toAmount === "number"
        ? toIsCrypto
          ? formatCrypto(toAmount)
          : formatFiat(toAmount, fiat)
        : "";

  const clearFrom = () => setFromAmount("");

  return (
    <div className={styles.card}>
      <div className={styles.layoutWrap}>
        <div className={styles.row}>
          <span className={styles.rowLabel} aria-hidden>Из</span>
          <div className={styles.inputWrap}>
            <input
              type="text"
              inputMode="decimal"
              className={styles.input}
              value={fromDisplayValue}
              onChange={(e) => setFromAmount(e.target.value)}
              aria-label={fromIsCrypto ? "Количество криптовалюты" : "Сумма в валюте"}
            />
            <button
              type="button"
              className={styles.clear}
              onClick={clearFrom}
              aria-label="Очистить"
            >
              ×
            </button>
            <button
              type="button"
              className={styles.selector}
              onClick={() => (fromIsCrypto ? setCoinModalOpen(true) : setCurrencyModalOpen(true))}
            >
              {fromIsCrypto ? (
                <>
                  {getCryptoIconUrl(crypto) ? (
                    <img
                      src={getCryptoIconUrl(crypto)!}
                      alt=""
                      className={styles.cryptoIcon}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <span className={styles.cryptoIconFallback}>{crypto.charAt(0)}</span>
                  )}
                  <span className={styles.symbol}>{crypto}</span>
                  <span className={styles.chevron}>▼</span>
                </>
              ) : (
                <>
                  <span className={styles.symbol}>
                    {FIAT_OPTIONS.find((f) => f.code === fiat)?.symbol ?? fiat.toUpperCase()}
                  </span>
                  <span className={styles.code}>{fiat.toUpperCase()}</span>
                  <span className={styles.chevron}>▼</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className={styles.middle}>
          <button
            type="button"
            className={styles.swapBtn}
            onClick={handleSwap}
            aria-label="Поменять направление конвертации"
          >
            ⇅
          </button>
          {rateLabel && (
            <span className={styles.rateLabelMobile} aria-hidden>
              {rateLabel}
            </span>
          )}
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel} aria-hidden>В</span>
          <div className={styles.inputWrap}>
            <input
              type="text"
              className={styles.input}
              value={toDisplayValue}
              readOnly
              aria-label={toIsCrypto ? "Количество криптовалюты" : "Сумма в валюте"}
            />
            <button
              type="button"
              className={styles.selector}
              onClick={() => (toIsCrypto ? setCoinModalOpen(true) : setCurrencyModalOpen(true))}
            >
              {toIsCrypto ? (
                <>
                  {getCryptoIconUrl(crypto) ? (
                    <img
                      src={getCryptoIconUrl(crypto)!}
                      alt=""
                      className={styles.cryptoIcon}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <span className={styles.cryptoIconFallback}>{crypto.charAt(0)}</span>
                  )}
                  <span className={styles.symbol}>{crypto}</span>
                  <span className={styles.chevron}>▼</span>
                </>
              ) : (
                <>
                  <span className={styles.symbol}>
                    {FIAT_OPTIONS.find((f) => f.code === fiat)?.symbol ?? fiat.toUpperCase()}
                  </span>
                  <span className={styles.code}>{fiat.toUpperCase()}</span>
                  <span className={styles.chevron}>▼</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingBar}>
          <div className={styles.spinner} />
        </div>
      )}

      <CoinSelector
        isOpen={coinModalOpen}
        onClose={() => setCoinModalOpen(false)}
        onSelect={setCrypto}
        currentSymbol={crypto}
      />
      <CurrencySelector
        isOpen={currencyModalOpen}
        onClose={() => setCurrencyModalOpen(false)}
        onSelect={setFiat}
        currentCode={fiat}
        rateText={rateLabel}
      />
       {rateLabel && (
            <span className={styles.rateLabelDesktop} aria-hidden>
              {rateLabel}
            </span>
          )}
    </div>
  );
}
