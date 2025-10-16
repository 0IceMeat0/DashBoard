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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

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
      <div className={styles.containerLoader}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Ошибка загрузки данных: {error}</div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Нет данных для отображения</div>
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
  const isFlatSmallRange = volatility < 0.012 || selectedPeriod === "1d";

  // Δ% считаем ВСЕГДА — чтобы тултип всегда показывал процент
  const firstPrice = prices[0];
  const dataAugmented = data.map((d) => ({
    ...d,
    priceDeltaPct: firstPrice ? (d.price / firstPrice - 1) * 100 : 0,
  }));

  // домены для абсолютов
  const paddingBase = priceRange * (isFlatSmallRange ? 0.25 : 0.1);
  const getDynamicStep = (range: number) => {
    if (range > 10000) return 1000;
    if (range > 5000) return 500;
    if (range > 1000) return 100;
    if (range > 200) return 50;
    return 10;
    // под свои активы можно подкрутить
  };
  const step = getDynamicStep(priceRange);
  const roundDown = (num: number, s: number) => Math.floor(num / s) * s;
  const roundUp = (num: number, s: number) => Math.ceil(num / s) * s;

  const roundedMin = roundDown(minPrice - paddingBase, step);
  const roundedMax = roundUp(maxPrice + paddingBase, step);

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
                    : [roundedMin, roundedMax]
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
                tickCount={6}
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
