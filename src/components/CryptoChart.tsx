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

  // Проверяем ширину экрана для отключения оси Y на мобилках
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 767);
    };

    handleResize(); // сразу при монтировании
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data, loading, error } = useChartData({
    crypto,
    currency,
    period: selectedPeriod,
  });

  const periods = ChartService.getSupportedPeriods();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTooltipDate = (timestamp: number) => {
    const date = new Date(timestamp);

    if (selectedPeriod === "1d") {
      return date.toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: { price: number; timestamp: number } }[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            {crypto.toUpperCase()}/
            {currency === "usd" ? "USDT" : currency.toUpperCase()} :{" "}
            {formatPrice(data.price)}
          </div>
          <div className={styles.tooltipDate}>
            {formatTooltipDate(data.timestamp)}
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
          <div className={styles.spinner}></div>
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

  // === ЦЕНОВОЙ ДИАПАЗОН ===
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Определяем шаг округления
  const getDynamicStep = (range: number) => {
    if (range > 10000) return 1000;
    if (range > 5000) return 500;
    if (range > 1000) return 100;
    return 50;
  };

  const step = getDynamicStep(priceRange);

  const roundDown = (num: number, step: number) =>
    Math.floor(num / step) * step;
  const roundUp = (num: number, step: number) => Math.ceil(num / step) * step;

  const roundedMin = roundDown(minPrice - padding, step);
  const roundedMax = roundUp(maxPrice + padding, step);

  // === РЕНДЕР ===
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.typeCrypto}>
          <CryptoPriceDisplay crypto={crypto} currency={currency} />
        </div>

        <div className={styles.periods}>
          {periods.map((period) => (
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
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            <XAxis
              dataKey="formattedDate"
              stroke="var(--foreground, #222)"
              fontSize={12}
              fontWeight="700"
              fontFamily="'Roboto', sans-serif"
              tickLine={false}
              axisLine={false}
            />

            {/* 👇 Скрываем ось Y на мобильных устройствах */}
            {!isMobile && (
              <YAxis
                domain={[roundedMin, roundedMax]}
                tickFormatter={formatPrice}
                stroke="var(--foreground, #222)"
                fontSize={12}
                fontWeight="700"
                fontFamily="'Roboto', sans-serif"
                tickLine={false}
                axisLine={false}
                className={styles.moneyY}
              />
            )}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#ffc536",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              position={{ x: undefined, y: undefined }}
            />

            <Line
              type="monotone"
              dataKey="price"
              stroke="#ffc536"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#ffc536" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.priceRange}>
        <div className={styles.priceMin}>Мин: {formatPrice(minPrice)}</div>
        <div className={styles.priceMax}>Макс: {formatPrice(maxPrice)}</div>
      </div>
    </div>
  );
};
