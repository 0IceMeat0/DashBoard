import axios from "axios";

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
  formattedDate: string;
}

export interface ChartResponse {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
}

const BINANCE_API_URL = "https://api.binance.com/api/v3";

// Маппинг криптовалют для Binance
const CRYPTO_MAP: Record<string, string> = {
  btc: "BTC",
  eth: "ETH",
  ton: "TON",
  sol: "SOL",
  ada: "ADA",
  dot: "DOT",
  matic: "MATIC",
  avax: "AVAX",
  link: "LINK",
  atom: "ATOM",
};

// Маппинг валют для Binance
const CURRENCY_MAP: Record<string, string> = {
  usd: "USDT",
  rub: "RUB",
  euro: "EUR",
  eur: "EUR",
};

// Маппинг временных периодов
const TIME_PERIODS: Record<string, { interval: string; limit: number }> = {
  "1d": { interval: "1h", limit: 24 },
  "30d": { interval: "1d", limit: 30 },
  "3m": { interval: "1d", limit: 90 },
  "1y": { interval: "1d", limit: 365 }, // Используем дневные данные для года
};

export class ChartService {
  static async getHistoricalData(
    crypto: string,
    currency: string,
    period: string
  ): Promise<ChartResponse> {
    try {
      const cryptoId = CRYPTO_MAP[crypto.toLowerCase()];
      const currencyId = CURRENCY_MAP[currency.toLowerCase()];
      const timeConfig = TIME_PERIODS[period];

      if (!cryptoId || !currencyId || !timeConfig) {
        return {
          data: [],
          loading: false,
          error: "Неподдерживаемая пара или период",
        };
      }

      const symbol = `${cryptoId}${currencyId}`;
      const url = `${BINANCE_API_URL}/klines`;

      const params = {
        symbol,
        interval: timeConfig.interval,
        limit: timeConfig.limit,
      };

      const response = await axios.get(url, { params });
      const klines = response.data;

      const chartData: ChartDataPoint[] = klines.map((kline: (string | number)[]) => {
        const timestamp = kline[0];
        const price = parseFloat(String(kline[4])); // Цена закрытия
        const date = new Date(timestamp);

        return {
          timestamp,
          price,
          date: date.toISOString(),
          formattedDate: this.formatDate(date, period),
        };
      });

      return {
        data: chartData,
        loading: false,
        error: null,
      };
    } catch (error) {
      console.error("Ошибка получения исторических данных:", error);

      // Генерируем тестовые данные если API недоступен
      return {
        data: this.generateMockData(period),
        loading: false,
        error: "Используются тестовые данные",
      };
    }
  }

  private static formatDate(date: Date, period: string): string {
    const options: Intl.DateTimeFormatOptions = {};

    switch (period) {
      case "1d":
        options.hour = "2-digit";
        options.minute = "2-digit";
        break;
      case "30d":
        options.day = "numeric";
        options.month = "short";
        break;
      case "3m":
        options.day = "numeric";
        options.month = "short";
        break;
      case "1y":
        // Для года показываем каждый месяц с днем
        options.day = "numeric";
        options.month = "short";
        break;
      default:
        options.day = "numeric";
        options.month = "short";
    }

    return new Intl.DateTimeFormat("ru-RU", options).format(date);
  }

  private static generateMockData(period: string): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const now = Date.now();
    const timeConfig = TIME_PERIODS[period];

    if (!timeConfig) return data;

    let intervalMs = 0;
    switch (period) {
      case "1d":
        intervalMs = 60 * 60 * 1000; // 1 час
        break;
      case "30d":
      case "3m":
        intervalMs = 24 * 60 * 60 * 1000; // 1 день
        break;
      case "1y":
        intervalMs = 24 * 60 * 60 * 1000; // 1 день для точности
        break;
    }

    let basePrice = 50000 + Math.random() * 50000; // Базовая цена 50-100k

    for (let i = 0; i < timeConfig.limit; i++) {
      const timestamp = now - (timeConfig.limit - i) * intervalMs;
      const date = new Date(timestamp);

      // Генерируем реалистичные колебания цены
      const change = (Math.random() - 0.5) * 0.1; // ±5% изменение
      basePrice = basePrice * (1 + change);

      data.push({
        timestamp,
        price: Math.round(basePrice * 100) / 100,
        date: date.toISOString(),
        formattedDate: this.formatDate(date, period),
      });
    }

    return data;
  }

  static getSupportedPeriods(): string[] {
    return Object.keys(TIME_PERIODS);
  }

  static getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      "1d": "1д",
      "30d": "30д",
      "3m": "3м",
      "1y": "1г",
    };
    return labels[period] || period;
  }
}
