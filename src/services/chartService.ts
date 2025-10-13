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

// Маппинг валют (котируемая часть)
const CURRENCY_MAP: Record<string, string> = {
  usd: "USDT",
  usdt: "USDT",
  eur: "EUR",
  euro: "EUR",
  rub: "RUB",
  rur: "RUB",
};

// Периоды
const TIME_PERIODS: Record<string, { interval: string; limit: number }> = {
  "1d": { interval: "1h", limit: 24 },
  "7d": { interval: "1h", limit: 168 },
  "30d": { interval: "1d", limit: 30 },
  "3m": { interval: "1d", limit: 90 },
  "1y": { interval: "1d", limit: 365 },
};

export class ChartService {
  private static coinCache: Record<string, string> | null = null; // { btc: "BTC", ton: "TON", ... }

  /** 🔹 Загружает список всех монет с Binance и кэширует */
  private static async ensureCoins(): Promise<void> {
    if (this.coinCache) return;

    try {
      const { data } = await axios.get(`${BINANCE_API_URL}/exchangeInfo`, {
        timeout: 20000,
      });

      const map: Record<string, string> = {};

      for (const s of data.symbols) {
        if (s.status === "TRADING") {
          const base = s.baseAsset.toLowerCase();
          map[base] = s.baseAsset; // например btc → BTC
        }
      }

      this.coinCache = map;
      console.log(`✅ Binance coins loaded (${Object.keys(map).length} total)`);
    } catch (err) {
      console.error("Ошибка загрузки списка монет Binance:", err);
      this.coinCache = {}; // пустой fallback, чтобы не ломать вызовы
    }
  }

  /** 📈 Получить исторические данные по монете */
  static async getHistoricalData(
    crypto: string,
    currency: string,
    period: string
  ): Promise<ChartResponse> {
    try {
      await this.ensureCoins();

      const cryptoId = this.coinCache?.[crypto.toLowerCase()];
      const currencyId = CURRENCY_MAP[currency.toLowerCase()];
      const timeConfig = TIME_PERIODS[period];

      if (!cryptoId || !currencyId || !timeConfig) {
        return {
          data: [],
          loading: false,
          error: `Неподдерживаемая пара или период: ${crypto}/${currency}`,
        };
      }

      const symbol = `${cryptoId}${currencyId}`;
      const url = `${BINANCE_API_URL}/klines`;

      const { data } = await axios.get(url, {
        params: {
          symbol,
          interval: timeConfig.interval,
          limit: timeConfig.limit,
        },
        timeout: 20000,
      });

      if (!Array.isArray(data) || data.length === 0) {
        return {
          data: this.generateMockData(period),
          loading: false,
          error: `Нет данных для пары ${symbol}`,
        };
      }

      const chartData: ChartDataPoint[] = data.map(
        (kline: (string | number)[]) => {
          const timestamp = Number(kline[0]);
          const price = parseFloat(String(kline[4])); // цена закрытия
          const date = new Date(timestamp);
          return {
            timestamp,
            price,
            date: date.toISOString(),
            formattedDate: this.formatDate(date, period),
          };
        }
      );

      return { data: chartData, loading: false, error: null };
    } catch (error) {
      console.error("Ошибка получения исторических данных:", error);
      return {
        data: this.generateMockData(period),
        loading: false,
        error: "Используются тестовые данные",
      };
    }
  }

  /** 📅 Форматирование даты для оси графика */
  private static formatDate(date: Date, period: string): string {
    const options: Intl.DateTimeFormatOptions = {};
    switch (period) {
      case "1d":
        options.hour = "2-digit";
        options.minute = "2-digit";
        break;
      case "7d":
        options.hour = "2-digit";
        options.day = "numeric";
        break;
      default:
        options.day = "numeric";
        options.month = "short";
    }
    return new Intl.DateTimeFormat("ru-RU", options).format(date);
  }

  /** 🧪 Генерация фейковых данных, если Binance недоступен */
  private static generateMockData(period: string): ChartDataPoint[] {
    const cfg = TIME_PERIODS[period];
    if (!cfg) return [];

    const now = Date.now();
    const intervalMs =
      cfg.interval === "1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    let basePrice = 50000 + Math.random() * 50000;
    const out: ChartDataPoint[] = [];

    for (let i = 0; i < cfg.limit; i++) {
      const timestamp = now - (cfg.limit - i) * intervalMs;
      const date = new Date(timestamp);
      basePrice *= 1 + (Math.random() - 0.5) * 0.1;
      out.push({
        timestamp,
        price: Math.round(basePrice * 100) / 100,
        date: date.toISOString(),
        formattedDate: this.formatDate(date, period),
      });
    }

    return out;
  }

  static getSupportedPeriods(): string[] {
    return Object.keys(TIME_PERIODS);
  }

  static getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      "1d": "1д",
      "7d": "7д",
      "30d": "30д",
      "3m": "3м",
      "1y": "1г",
    };
    return labels[period] || period;
  }
}
