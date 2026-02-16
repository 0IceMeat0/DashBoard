"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./page.module.scss";

interface HalvingStep {
  year: number; // Год халвинга
  date: string; // Дата халвинга
  rewardBefore: number; // Высота линии ДО халвинга (откуда идет линия)
  rewardAfter: number; // Высота линии ПОСЛЕ халвинга (куда падает линия)
  block: number; // Номер блока
  status: "completed" | "upcoming"; // Статус
}

// КОНСТАНТА ДЛЯ УПРАВЛЕНИЯ ГРАФИКОМ
// Меняйте rewardBefore и rewardAfter для каждого шага, чтобы изменить линии на графике
const HALVING_STEPS: HalvingStep[] = [
  {
    year: 2009,
    date: "2009-01-03",
    rewardBefore: 50, // Линия начинается на высоте 50
    rewardAfter: 25, // И остается на 50 до первого халвинга
    block: 0,
    status: "completed",
  },
  {
    year: 2012,
    date: "2012-11-28",
    rewardBefore: 25, // Линия идет на высоте 50 ДО этого халвинга
    rewardAfter: 12.5, // Падает до 25 ПОСЛЕ этого халвинга
    block: 210000,
    status: "completed",
  },
  {
    year: 2016,
    date: "2016-07-09",
    rewardBefore: 12.5, // Линия идет на высоте 25 ДО этого халвинга
    rewardAfter: 6.25, // Падает до 12.5 ПОСЛЕ этого халвинга
    block: 420000,
    status: "completed",
  },
  {
    year: 2020,
    date: "2020-05-11",
    rewardBefore: 6.25, // Линия идет на высоте 12.5 ДО этого халвинга
    rewardAfter: 3.125, // Падает до 6.25 ПОСЛЕ этого халвинга
    block: 630000,
    status: "completed",
  },
  {
    year: 2024,
    date: "2024-04-20",
    rewardBefore: 3.125, // Линия идет на высоте 6.25 ДО этого халвинга
    rewardAfter: 1.5625, // Падает до 3.125 ПОСЛЕ этого халвинга
    block: 840000,
    status: "completed",
  },
  {
    year: 2028,
    date: "2028-04-20",
    rewardBefore: 1.5625, // Линия идет на высоте 3.125 ДО этого халвинга
    rewardAfter: 0.78125, // Падает до 1.5625 ПОСЛЕ этого халвинга
    block: 1050000,
    status: "upcoming",
  },
  {
    year: 2032,
    date: "2032-04-20",
    rewardBefore: 0.78125, // Линия идет на высоте 1.5625 ДО этого халвинга
    rewardAfter: 0.390625, // Падает до 0.78125 ПОСЛЕ этого халвинга
    block: 1260000,
    status: "upcoming",
  },
  {
    year: 2036,
    date: "2036-04-20",
    rewardBefore: 0.195, // Линия идет на высоте 0.78125 ДО этого халвинга
    rewardAfter: 0.195, // Падает до 0.390625 ПОСЛЕ этого халвинга
    block: 1470000,
    status: "upcoming",
  },
];

const END_YEAR = 2039; // Год для продления линии графика
const LAST_HALVING_YEAR = Math.max(...HALVING_STEPS.map((s) => s.year)); // Последний год с халвингом

export default function BtcHalvingStatusPage() {
  const [loading, setLoading] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1200);
      setIsVerySmallScreen(window.innerWidth < 600);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Генерируем данные для step chart
  const generateChartData = () => {
    const data: Array<{
      year: number;
      reward: number;
      date: string;
      block: number;
      status: string;
      isHalving: boolean;
      rewardAfter?: number; // Сохраняем rewardAfter для tooltip
    }> = [];

    // Начальная точка
    const firstStep = HALVING_STEPS[0];
    data.push({
      year: firstStep.year,
      reward: firstStep.rewardBefore,
      date: firstStep.date,
      block: firstStep.block,
      status: firstStep.status,
      isHalving: true,
    });

    // Для каждого шага создаем точки
    for (let i = 1; i < HALVING_STEPS.length; i++) {
      const step = HALVING_STEPS[i];
      const prevStep = HALVING_STEPS[i - 1];
      const nextStep = HALVING_STEPS[i + 1];

      // 1. Точка ПЕРЕД халвингом (на уровне rewardBefore) - для линии
      // Проверяем, нет ли уже такой точки (чтобы избежать дубликатов)
      const hasBeforePoint = data.some(
        (p) => p.year === step.year && p.reward === step.rewardBefore
      );
      if (!hasBeforePoint) {
        data.push({
          year: step.year,
          reward: step.rewardBefore, // Высота ДО халвинга
          date: step.date,
          block: step.block,
          status: step.status,
          isHalving: false, // Это не точка халвинга, только для линии
        });
      }

      // 2. Точка НА халвинге (в месте падения линии)
      // Для stepAfter точка должна быть в году халвинга на уровне rewardBefore (начало падения)
      data.push({
        year: step.year, // Точка в году халвинга
        reward: step.rewardBefore, // Точка на уровне rewardBefore - в месте начала падения
        date: step.date,
        block: step.block,
        status: step.status,
        isHalving: true, // Это точка халвинга - в месте начала падения линии!
        rewardAfter: step.rewardAfter, // Сохраняем для tooltip
      });

      // 3. Точка ПОСЛЕ халвинга (горизонтальная линия до следующего халвинга)
      // Создаем только если rewardAfter не совпадает с rewardBefore следующего шага
      if (nextStep) {
        // Если rewardAfter текущего шага не равен rewardBefore следующего, создаем точку
        if (step.rewardAfter !== nextStep.rewardBefore) {
          data.push({
            year: nextStep.year,
            reward: step.rewardAfter, // Продолжаем на уровне rewardAfter
            date: step.date,
            block: step.block,
            status: step.status,
            isHalving: false,
          });
        }
      } else {
        // Последний шаг - до конца графика
        data.push({
          year: END_YEAR,
          reward: step.rewardAfter,
          date: step.date,
          block: step.block,
          status: step.status,
          isHalving: false,
        });
      }
    }

    // Сортируем: сначала по году, потом по reward (большее значение первым для stepAfter)
    return data.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return b.reward - a.reward;
    });
  };

  const chartData = generateChartData();
  const halvingPoints = chartData.filter((point) => point.isHalving);

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const CustomTooltip = ({
    active,
    payload,
    coordinate,
    viewBox,
  }: {
    active?: boolean;
    payload?: Array<{
      payload?: {
        year?: number;
        reward?: number;
        date?: string;
        block?: number;
        status?: string;
        isHalving?: boolean;
        rewardAfter?: number;
      };
      value?: number;
      dataKey?: string;
      name?: string;
    }>;
    coordinate?: { x?: number; y?: number };
    viewBox?: { x?: number; y?: number; width?: number; height?: number };
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    // Ищем только точки халвингов (из Line с name="halving")
    let data = null;
    for (const p of payload) {
      // Проверяем, что это точка халвинга (isHalving === true)
      if (p.payload?.isHalving === true && p.payload.date) {
        data = p.payload;
        break;
      }
    }

    // Если не нашли точку халвинга, не показываем tooltip
    if (!data || !data.isHalving) return null;

    // Используем rewardAfter для tooltip, если он есть (точка халвинга)
    const displayReward = data.rewardAfter !== undefined ? data.rewardAfter : data.reward;

    // Определяем позицию tooltip с учетом границ экрана
    const tooltipWidth = 220;
    const tooltipHeight = 80;
    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const padding = 20;
    
    // Получаем реальные координаты точки на экране
    // coordinate - это координаты относительно графика
    // viewBox - это позиция графика на странице
    let screenX = 0;
    let screenY = 0;
    
    if (coordinate?.x !== undefined && coordinate?.y !== undefined) {
      // Если есть viewBox, используем его для вычисления абсолютной позиции
      if (viewBox?.x !== undefined && viewBox?.y !== undefined) {
        screenX = viewBox.x + coordinate.x;
        screenY = viewBox.y + coordinate.y;
      } else {
        // Иначе используем координаты напрямую (они уже относительно контейнера)
        screenX = coordinate.x;
        screenY = coordinate.y;
      }
    }
    
    // Определяем, куда показывать tooltip
    const hasSpaceRight = screenX + tooltipWidth + padding < screenWidth;
    const hasSpaceLeft = screenX - tooltipWidth - padding > 0;
    const hasSpaceBottom = screenY + tooltipHeight + padding < screenHeight;
    const hasSpaceTop = screenY - tooltipHeight - padding > 0;
    
    // Приоритет: справа > слева > снизу > сверху
    // Первая точка (2009) — тултип всегда вправо, в сторону графика, чтобы был виден
    const isFirstPoint = data.year === 2009;
    const isLastPoint = data.year === LAST_HALVING_YEAR;

    let tooltipStyle: React.CSSProperties = {};

    if (isFirstPoint) {
      tooltipStyle = {
        transform: "translateY(-50%)",
        marginLeft: "10px",
        marginTop: 0,
      };
    } else if (isLastPoint) {
      tooltipStyle = {
        transform: "translateX(-100%)",
        marginLeft: "-10px",
        marginTop: "-40px",
      };
    } else if (hasSpaceRight) {
      tooltipStyle = {
        transform: "translateX(0)",
        marginLeft: "10px",
        marginTop: "-40px",
      };
    } else if (hasSpaceLeft) {
      tooltipStyle = {
        transform: "translateX(-100%)",
        marginLeft: "-10px",
        marginTop: "-40px",
      };
    } else if (hasSpaceBottom) {
      tooltipStyle = {
        transform: "translateX(-50%)",
        marginLeft: "0",
        marginTop: "10px",
        left: "50%",
      };
    } else if (hasSpaceTop) {
      tooltipStyle = {
        transform: "translateX(-50%)",
        marginLeft: "0",
        marginTop: "-90px",
        left: "50%",
      };
    } else {
      tooltipStyle = {
        transform: "translateX(0)",
        marginLeft: "10px",
        marginTop: "-40px",
      };
    }

    return (
      <div 
        className={styles.tooltip}
        style={tooltipStyle}
      >
        <div className={styles.tooltipText}>
          {formatDateShort(data.date!)} награда {displayReward} BTC
          {data.block !== undefined && data.block > 0 && (
            <div className={styles.tooltipBlock}>Блок: {data.block.toLocaleString()}</div>
          )}
        </div>
      </div>
    );
  };

  const CustomDot = (props: {
    cx?: number;
    cy?: number;
    payload?: {
      isHalving: boolean;
      status: string;
    };
  }) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload?.isHalving) return null;

    const isCompleted = payload.status === "completed";
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={isCompleted ? "#ffc536" : "#000000"} // Черная заливка для upcoming
        stroke={isCompleted ? "#ffc536" : "#888"}
        strokeWidth={2}
        style={{ filter: isCompleted ? "drop-shadow(0 0 4px rgba(255, 197, 54, 0.5))" : "none" }}
      />
    );
  };

  const CustomActiveDot = (props: {
    cx?: number;
    cy?: number;
    payload?: {
      isHalving: boolean;
      status: string;
    };
  }) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload?.isHalving) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#ffc536"
        stroke="#fff"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 6px rgba(255, 197, 54, 0.8))" }}
      />
    );
  };

  const CustomXAxisTick = (props: {
    x?: number;
    y?: number;
    payload?: {
      value: number;
    };
  }) => {
    const { x, y, payload } = props;
    if (!x || !y || !payload) return null;

    const step = HALVING_STEPS.find((s) => s.year === payload.value);
    if (!step) return null;

    // На маленьких экранах показываем только год
    const displayText = isSmallScreen 
      ? step.year.toString() 
      : (() => {
          const date = new Date(step.date);
          const day = date.getDate();
          const month = date.toLocaleDateString("ru-RU", { month: "short" });
          const year = date.getFullYear();
          return `${day} ${month} ${year} г.`;
        })();

    // На очень маленьких экранах уменьшаем шрифт, но не так сильно
    const fontSize = isVerySmallScreen ? 9 : 14;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#ffc536"
          fontSize={fontSize}
          fontWeight={600}
          fontFamily="Roboto, sans-serif"
        >
          {displayText}
        </text>
      </g>
    );
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500} style={{ position: "relative", zIndex: 1 }}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 50, left: 50, bottom: 60 }}
            >
              <defs>
                <linearGradient id="rewardGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffc536" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ffc536" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#444"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              <XAxis
                dataKey="year"
                stroke="#ffc536"
                tickLine={false}
                axisLine={false}
                tick={<CustomXAxisTick />}
                domain={[2009, LAST_HALVING_YEAR + (isVerySmallScreen ? 0.5 : 2)]} // На маленьких экранах уменьшаем отступ
                ticks={HALVING_STEPS.map((s) => s.year)}
                type="number"
                padding={isVerySmallScreen ? { left: 10, right: 10 } : { left: 0, right: 0 }} // На маленьких экранах уменьшаем padding
              />
              <YAxis
                domain={[0, 50]}
                stroke="#ffc536"
                tick={{ 
                  fill: "#ffc536", 
                  fontSize: isVerySmallScreen ? 10 : 16, 
                  fontWeight: 700, 
                  fontFamily: "Roboto, sans-serif" 
                }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
                label={
                  isSmallScreen
                    ? undefined // Скрываем label на маленьких экранах
                    : {
                        value: "Награда, BTC",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#ffc536",
                        style: { 
                          textAnchor: "middle", 
                          fontSize: isVerySmallScreen ? 10 : 16, 
                          fontWeight: 700, 
                          fontFamily: "Roboto, sans-serif" 
                        },
                      }
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
                filterNull={true}
                shared={false}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 99999, position: "absolute" }}
              />
              <Area
                type="stepAfter"
                dataKey="reward"
                fill="url(#rewardGradient)"
                stroke="none"
              />
              <Line
                type="stepAfter"
                dataKey="reward"
                stroke="#ffc536"
                strokeWidth={3}
                dot={false}
                activeDot={false}
                isAnimationActive={true}
                connectNulls={false}
              />
              {/* Отдельный Line для точек халвингов - только они активны при наведении */}
              <Line
                name="halving"
                dataKey="reward"
                data={halvingPoints}
                stroke="none"
                dot={(props) => {
                  const { key, ...restProps } = props;
                  return <CustomDot key={key} {...restProps} />;
                }}
                activeDot={(props) => {
                  const { key, ...restProps } = props;
                  return <CustomActiveDot key={key} {...restProps} />;
                }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

