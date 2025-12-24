"use client";

import { useState, useEffect } from "react";
import styles from "./BitcoinHalvingCountdown.module.scss";

// Даты халвингов биткоина
const HALVING_DATES = [
  new Date("2009-01-03T00:00:00Z"),
  new Date("2012-11-28T00:00:00Z"),
  new Date("2016-07-09T00:00:00Z"),
  new Date("2020-05-11T00:00:00Z"),
  new Date("2024-04-20T00:00:00Z"),
  new Date("2028-04-20T00:00:00Z"),
  new Date("2032-04-20T00:00:00Z"),
  new Date("2036-04-20T00:00:00Z"),
];

export const BitcoinHalvingCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(() => {
    // Инициализируем с нулевыми значениями для предотвращения hydration ошибок
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  });
  const [isExpired, setIsExpired] = useState(false);
  const [nextHalvingDate, setNextHalvingDate] = useState<Date | null>(null);

  useEffect(() => {
    const findNextHalving = () => {
      const now = new Date();
      // Находим следующий халвинг (дата в будущем)
      for (const halvingDate of HALVING_DATES) {
        if (halvingDate > now) {
          return halvingDate;
        }
      }
      return null; // Все халвинги прошли
    };

    const calculateTimeLeft = (targetDate: Date) => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    // Находим следующий халвинг
    const nextHalving = findNextHalving();
    setNextHalvingDate(nextHalving);

      if (!nextHalving) {
      setIsExpired(true);
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    // Устанавливаем начальное значение
    setTimeLeft(calculateTimeLeft(nextHalving));
    setIsExpired(false);

    // Обновляем каждую секунду
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(nextHalving);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        setIsExpired(true);
        // Ищем следующий халвинг после истечения текущего
        const newNextHalving = findNextHalving();
        if (newNextHalving) {
          setNextHalvingDate(newNextHalving);
          setIsExpired(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Функция для правильного склонения слова "день"
  const getDayLabel = (days: number) => {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    // Исключения для 11-14
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return "дней";
    }

    // 1, 21, 31, 41... день
    if (lastDigit === 1) {
      return "день";
    }

    // 2-4, 22-24, 32-34... дня
    if (lastDigit >= 2 && lastDigit <= 4) {
      return "дня";
    }

    // 5-20, 25-30, 35-40... дней
    return "дней";
  };

  if (isExpired) {
    return (
      <div className={styles.container}>
        <div className={styles.title}>Следующий халвинг биткоина</div>
        <div className={styles.expired}>Халвинг уже произошел!</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.countdown}>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(timeLeft.days).padStart(2, "0")}</span>
          <span className={styles.timeLabel}>{getDayLabel(timeLeft.days)}</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className={styles.timeLabel}>Часов</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className={styles.timeLabel}>Минут</span>
        </div>
        <span className={styles.separator}>:</span>
        <div className={styles.timeUnit}>
          <span className={styles.timeValue}>{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className={styles.timeLabel}>Секунд</span>
        </div>
      </div>
    </div>
  );
};

