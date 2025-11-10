"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useChartData } from "../hooks/useChartData";
import { ChartService } from "../services/chartService";
import styles from "./CryptoChart.module.scss";
import { CryptoPriceDisplay } from "./CryptoPriceDisplay";

interface CryptoChartProps {
  crypto: string;
  currency: string;
}

export const CryptoChart = ({ crypto, currency }: CryptoChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("1y");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 500);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data, loading, error } = useChartData({
    crypto,
    currency,
    period: selectedPeriod,
  });

  const selectedPeriodLabel = ChartService.getPeriodLabel(selectedPeriod).toLowerCase();

  const formatPrice = (price: number) => {
    if (price === 0) {
      return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }
    const absPrice = Math.abs(price);
    // Для очень маленьких цен (< 0.01) показываем больше знаков без лишних нулей
    if (absPrice < 0.01) {
      const decimals = Math.max(4, Math.ceil(-Math.log10(absPrice)) + 2);
      return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.min(decimals, 6),
      }).format(price);
    }
    // Для обычных цен используем стандартное форматирование
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTooltipDate = (ts: number) => {
    const date = new Date(ts);
    return selectedPeriod === "1d"
      ? date.toLocaleString("ru-RU", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : date.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  };

  // кастомный тик для мобилы — сдвигаем надписи по X
  const MobileXAxisTick = (props: {
    x: number;
    y: number;
    payload: { value: number };
  }) => {
    const { x, y, payload } = props;
    const shift = -14; // сдвиг влево; при желании измени на -10/-20
    return (
      <text
        x={x + shift}
        y={y + 12}
        fill="var(--foreground, #222)"
        fontSize={12}
        fontWeight={700}
        fontFamily="'Roboto', sans-serif"
        textAnchor="middle"
      >
        {payload.value}
      </text>
    );
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: { payload: any }[];
  }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const price = p.price as number;
      const pct = p.priceDeltaPct as number;

      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            {crypto.toUpperCase()}/
            {currency === "usd" ? "USDT" : currency.toUpperCase()} :{" "}
            {formatPrice(price)}{" "}
            <span className={pct >= 0 ? styles.up : styles.down}>
              ({pct >= 0 ? "+" : ""}
              {pct.toFixed(2)}%)
            </span>
          </div>
          <div className={styles.tooltipDate}>
            {formatTooltipDate(p.timestamp)}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.typeCrypto}>
            <CryptoPriceDisplay
              crypto={crypto}
              currency={currency}
              overrideData={{
                usePeriodChange: true,
                isLoading: true,
                periodLabel: selectedPeriodLabel,
              }}
            />
          </div>

          <div className={styles.periods}>
            {ChartService.getSupportedPeriods().map((period) => (
              <button
                key={period}
                className={`${styles.periodButton} ${
                  selectedPeriod === period ? styles.active : ""
                }`}
                onClick={() => setSelectedPeriod(period)}
              >
                {ChartService.getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </div>

        {/* Placeholder для priceRange чтобы сохранить структуру */}
        <div className={styles.priceRange}>
          <div className={styles.priceMin}>Загрузка...</div>
          <div className={styles.priceMax}></div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.typeCrypto}>
            <CryptoPriceDisplay crypto={crypto} currency={currency} />
          </div>

          <div className={styles.periods}>
            {ChartService.getSupportedPeriods().map((period) => (
              <button
                key={period}
                className={`${styles.periodButton} ${
                  selectedPeriod === period ? styles.active : ""
                }`}
                onClick={() => setSelectedPeriod(period)}
              >
                {ChartService.getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.error}>Ошибка загрузки данных: {error}</div>
        </div>

        <div className={styles.priceRange}>
          <div className={styles.priceMin}>-</div>
          <div className={styles.priceMax}>-</div>
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.typeCrypto}>
            <CryptoPriceDisplay crypto={crypto} currency={currency} />
          </div>

          <div className={styles.periods}>
            {ChartService.getSupportedPeriods().map((period) => (
              <button
                key={period}
                className={`${styles.periodButton} ${
                  selectedPeriod === period ? styles.active : ""
                }`}
                onClick={() => setSelectedPeriod(period)}
              >
                {ChartService.getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.error}>Нет данных для отображения</div>
        </div>

        <div className={styles.priceRange}>
          <div className={styles.priceMin}>-</div>
          <div className={styles.priceMax}>-</div>
        </div>
      </div>
    );
  }

  // === подготовка данных и доменов ===
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const meanPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const priceRange = maxPrice - minPrice;

  const volatility = meanPrice ? priceRange / meanPrice : 0;
  // Для очень маленьких цен используем менее строгий порог волатильности
  const volatilityThreshold = meanPrice < 0.01 ? 0.05 : 0.012;
  const isFlatSmallRange = volatility < volatilityThreshold;

  // Δ% считаем ВСЕГДА — чтобы тултип всегда показывал процент
  const firstPrice = prices[0];
  const dataAugmented = data.map((d) => ({
    ...d,
    priceDeltaPct: firstPrice ? (d.price / firstPrice - 1) * 100 : 0,
  }));

  const lastPoint = dataAugmented[dataAugmented.length - 1];
  const currentPrice = lastPoint?.price ?? firstPrice;
  const periodChangeValue = currentPrice - (firstPrice ?? currentPrice);
  const periodChangePercent = lastPoint?.priceDeltaPct ?? 0;
  const lastUpdatedTs = lastPoint?.timestamp;

  // домены для абсолютов
  const tickTargetCount = selectedPeriod === "1y" ? 6 : 7;

  const getNiceStep = (range: number) => {
    if (range <= 0 || Number.isNaN(range)) {
      return 1;
    }
    const roughStep = range / Math.max(tickTargetCount - 1, 1);
    const exponent = Math.floor(Math.log10(roughStep));
    const fraction = roughStep / Math.pow(10, exponent);

    let niceFraction: number;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * Math.pow(10, exponent);
  };

  const effectiveRange = priceRange || Math.max(meanPrice * 0.02, 0.0001);
  const baseStep = getNiceStep(effectiveRange);
  const paddingMultiplier = isFlatSmallRange ? 0.4 : 0.2;
  const paddingBase = Math.max(baseStep, effectiveRange * paddingMultiplier);

  const adjustedMin = minPrice - paddingBase;
  const adjustedMax = maxPrice + paddingBase;

  const roundedMin = Math.floor(adjustedMin / baseStep) * baseStep;
  const roundedMax = Math.ceil(adjustedMax / baseStep) * baseStep;

  const adjustedRange = roundedMax - roundedMin;
  const minRange = baseStep * (tickTargetCount - 1);

  const finalMin = adjustedRange < minRange
    ? roundedMin - (minRange - adjustedRange) / 2
    : roundedMin;
  const finalMax = adjustedRange < minRange
    ? roundedMax + (minRange - adjustedRange) / 2
    : roundedMax;

  // домены для процентов
  const pctValues = dataAugmented.map((d) => d.priceDeltaPct);
  const pctMin = Math.min(...pctValues);
  const pctMax = Math.max(...pctValues);
  const pctRange = pctMax - pctMin || 1;
  const pctPadding = Math.max(0.2, pctRange * 0.2);
  const roundedPctMin = Math.floor((pctMin - pctPadding) * 10) / 10;
  const roundedPctMax = Math.ceil((pctMax + pctPadding) * 10) / 10;

  const lineWidth = isMobile ? 3 : isFlatSmallRange ? 3 : 2;
  const gridColor = "#eee";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.typeCrypto}>
          <CryptoPriceDisplay
            crypto={crypto}
            currency={currency}
            overrideData={{
              changeValue: periodChangeValue,
              changePercent: periodChangePercent,
              periodLabel: selectedPeriodLabel,
              lastUpdated: lastUpdatedTs,
              usePeriodChange: true,
            }}
          />
        </div>

        <div className={styles.periods}>
          {ChartService.getSupportedPeriods().map((period) => (
            <button
              key={period}
              className={`${styles.periodButton} ${
                selectedPeriod === period ? styles.active : ""
              }`}
              onClick={() => setSelectedPeriod(period)}
            >
              {ChartService.getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={dataAugmented}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

            <XAxis
              dataKey="formattedDate"
              stroke="var(--foreground, #222)"
              tickLine={false}
              axisLine={false}
              // на мобиле используем кастомный тик со сдвигом
              tick={
                isMobile ? (
                  <MobileXAxisTick
                    x={0}
                    y={0}
                    payload={{
                      value: 0,
                    }}
                  />
                ) : (
                  {
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Roboto', sans-serif",
                  }
                )
              }
            />

            {/* Y ось как раньше: скрываем на мобиле */}
            {!isMobile && (
              <YAxis
                domain={
                  isFlatSmallRange
                    ? [roundedPctMin, roundedPctMax]
                    : [finalMin, finalMax]
                }
                tickFormatter={(v: number) =>
                  isFlatSmallRange ? `${v.toFixed(1)}%` : formatPrice(v)
                }
                stroke="var(--foreground, #222)"
                fontSize={12}
                fontWeight="700"
                fontFamily="'Roboto', sans-serif"
                tickLine={false}
                axisLine={false}
                allowDecimals
                tickCount={tickTargetCount}
              />
            )}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#ffc536",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />

            <Line
              type="monotone"
              dataKey={isFlatSmallRange ? "priceDeltaPct" : "price"}
              stroke="#ffc536"
              strokeWidth={lineWidth}
              dot={false}
              activeDot={{ r: 4, fill: "#ffc536" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* нижний диапазон — всегда в абсолютных ценах */}
      <div className={styles.priceRange}>
        <div className={styles.priceMin}>Мин: {formatPrice(minPrice)}</div>
        <div className={styles.priceMax}>Макс: {formatPrice(maxPrice)}</div>
      </div>
    </div>
  );
};
