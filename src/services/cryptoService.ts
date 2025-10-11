import axios from "axios";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

const BINANCE_API_URL = "https://api.binance.com/api/v3";

// Маппинг криптовалют для Binance
const CRYPTO_MAP: Record<string, string> = {
  btc: "BTC",
  eth: "ETH",
  ton: "TON", // TON может быть недоступен на Binance
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

export class CryptoService {
  static async getCryptoPrice(
    crypto: string,
    currency: string
  ): Promise<CryptoPrice | null> {
    try {
      const cryptoId = CRYPTO_MAP[crypto.toLowerCase()];
      const currencyId = CURRENCY_MAP[currency.toLowerCase()];

      if (!cryptoId || !currencyId) {
        throw new Error(`Неподдерживаемая пара: ${crypto}/${currency}`);
      }

      // Формируем символ для Binance (например, BTCUSDT)
      const symbol = `${cryptoId}${currencyId}`;

      // Получаем данные о цене и изменениях
      const tickerUrl = `${BINANCE_API_URL}/ticker/24hr?symbol=${symbol}`;

      const response = await axios.get(tickerUrl, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
        },
      });

      const data = response.data;

      if (!data) {
        console.error("Нет данных для пары:", symbol);
        return null;
      }

      const result = {
        id: symbol.toLowerCase(),
        symbol: cryptoId,
        name: cryptoId,
        current_price: parseFloat(data.lastPrice),
        price_change_24h: parseFloat(data.priceChange),
        price_change_percentage_24h: parseFloat(data.priceChangePercent),
        last_updated: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      console.error("Ошибка получения курса криптовалюты:", error);

      // Если Binance не работает, попробуем альтернативный API
      if (error instanceof Error && error.message.includes("symbol")) {
        return await this.getCryptoPriceAlternative(crypto, currency);
      }

      return null;
    }
  }

  // Альтернативный метод с использованием другого API
  static async getCryptoPriceAlternative(
    crypto: string,
    currency: string
  ): Promise<CryptoPrice | null> {
    try {
      // Используем CoinCap API как альтернативу
      const COINCAP_API_URL = "https://api.coincap.io/v2";

      const cryptoId = crypto.toLowerCase();
      const currencyId = currency.toLowerCase();

      const response = await axios.get(
        `${COINCAP_API_URL}/assets/${cryptoId}`,
        {
          timeout: 10000,
        }
      );

      const data = response.data.data;

      if (!data) {
        return null;
      }

      // Конвертируем в нужную валюту (простая конвертация для примера)
      let price = parseFloat(data.priceUsd);
      if (currencyId === "rub") {
        // Примерный курс USD к RUB (в реальном приложении нужно получать актуальный курс)
        price = price * 95;
      } else if (currencyId === "eur") {
        price = price * 0.92;
      }

      return {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        current_price: price,
        price_change_24h: (parseFloat(data.changePercent24Hr) / 100) * price,
        price_change_percentage_24h: parseFloat(data.changePercent24Hr),
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Ошибка альтернативного API:", error);
      return null;
    }
  }

  static getSupportedCryptos(): string[] {
    return Object.keys(CRYPTO_MAP);
  }

  static getSupportedCurrencies(): string[] {
    return Object.keys(CURRENCY_MAP);
  }
}
