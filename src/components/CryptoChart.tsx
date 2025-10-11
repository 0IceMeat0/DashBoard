"use client";

import { useState } from "react";
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
import Image from "next/image";
import logo from "./assets/alt.png";
import bybit from "./assets/bybit.svg";
import Link from "next/link";

interface CryptoChartProps {
  crypto: string;
  currency: string;
}

export const CryptoChart = ({ crypto, currency }: CryptoChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("1y");
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

    // Форматируем дату в зависимости от выбранного периода
    if (selectedPeriod === "1d") {
      // Для дня показываем время
      return date.toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Для остальных периодов показываем дату
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { price: number; timestamp: number } }[] }) => {
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
          Загрузка графика...
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

  // Получаем минимальную и максимальную цены для настройки осей
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% отступ

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.typeCrypto}>
          <CryptoPriceDisplay crypto={crypto} currency={currency} />
        </div>
        <div className={styles.periods}>
          <div className={styles.logo}>
            <Link href="https://altcoinlog.com/?utm_source=dashboard">
              <Image className={styles.logoAlt} src={logo} alt="AltCoinLog" />
            </Link>
            <Link href="https://www.bybit.com/en/">
              <Image className={styles.bybit} src={bybit} alt="Bybit" />
            </Link>
          </div>
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
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={formatPrice}
              stroke="var(--foreground, #222)"
              fontSize={12}
              fontWeight="700"
              fontFamily="'Roboto', sans-serif"
              tickLine={false}
              axisLine={false}
            />
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
