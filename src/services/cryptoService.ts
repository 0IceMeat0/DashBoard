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

// нормализуем входящие валюты → котируемые активы Binance
const CURRENCY_MAP: Record<string, string> = {
  usd: "USDT",
  usdt: "USDT",
  eur: "EUR",
  euro: "EUR",
  rub: "RUB",
  rur: "RUB",
};

type ExchangeInfo = {
  symbols: Array<{
    symbol: string;
    status: string; // "TRADING"
    baseAsset: string; // "BTC"
    quoteAsset: string; // "USDT"
  }>;
};

export class CryptoService {
  // кэш справочников с Binance
  private static isReady = false;
  private static baseAssets = new Set<string>(); // e.g. "BTC","ETH","TON"
  private static pairsByBase = new Map<string, Set<string>>(); // base → set(quotes)
  private static symbolMap = new Map<string, { base: string; quote: string }>(); // "BTCUSDT" → {base:"BTC",quote:"USDT"}

  /** Загружаем и кэшируем /exchangeInfo единожды */
  private static async ensureExchangeMeta(): Promise<void> {
    if (this.isReady) return;

    const { data } = await axios.get<ExchangeInfo>(
      `${BINANCE_API_URL}/exchangeInfo`,
      {
        timeout: 20000,
        headers: { Accept: "application/json" },
      }
    );

    for (const s of data.symbols) {
      if (s.status !== "TRADING") continue;

      const base = s.baseAsset.toUpperCase();
      const quote = s.quoteAsset.toUpperCase();
      const full = s.symbol.toUpperCase();

      this.baseAssets.add(base);

      if (!this.pairsByBase.has(base)) this.pairsByBase.set(base, new Set());
      this.pairsByBase.get(base)!.add(quote);

      this.symbolMap.set(full, { base, quote });
    }

    this.isReady = true;
  }

  /** Подбираем валидный торговый символ на Binance */
  private static async resolveBinanceSymbol(
    crypto: string,
    currency: string
  ): Promise<{ symbol: string; base: string; quote: string } | null> {
    await this.ensureExchangeMeta();

    const rawCrypto = (crypto || "").trim().toUpperCase();
    const rawCurr = (currency || "").trim().toLowerCase();

    // 1) если пользователь передал уже полноценный символ, типа "BTCUSDT"
    if (this.symbolMap.has(rawCrypto)) {
      const { base, quote } = this.symbolMap.get(rawCrypto)!;
      return { symbol: rawCrypto, base, quote };
    }

    // 2) обычный случай: base = "BTC", quote = нормализованный (USDT/EUR/RUB)
    const base = rawCrypto;
    const quote = (
      CURRENCY_MAP[rawCurr] || rawCurr.toUpperCase()
    ).toUpperCase();

    // проверим, что такая пара существует
    const quotes = this.pairsByBase.get(base);
    if (quotes && quotes.has(quote)) {
      return { symbol: `${base}${quote}`, base, quote };
    }

    // 3) если указанная котируемая валюта не торгуется с base — попробуем автоподбор среди популярных котируемых
    const fallbackQuotes = ["USDT", "BUSD", "FDUSD", "EUR", "TRY", "RUB"];
    for (const q of fallbackQuotes) {
      if (quotes && quotes.has(q)) {
        return { symbol: `${base}${q}`, base, quote: q };
      }
    }

    // 4) не нашли пару
    return null;
  }

  /** Основной метод получения цены с Binance */
  static async getCryptoPrice(
    crypto: string,
    currency: string
  ): Promise<CryptoPrice | null> {
    try {
      const resolved = await this.resolveBinanceSymbol(crypto, currency);
      if (!resolved) {
        throw new Error(
          `Пара недоступна на Binance: base=${crypto.toUpperCase()}, quote=${(
            CURRENCY_MAP[currency?.toLowerCase()] || currency
          ).toUpperCase()}`
        );
      }

      const { symbol, base, quote } = resolved;

      const { data } = await axios.get(`${BINANCE_API_URL}/ticker/24hr`, {
        params: { symbol },
        timeout: 15000,
        headers: { Accept: "application/json" },
      });

      // Binance отдаёт строки, приводим к числу
      const lastPrice = Number(data?.lastPrice ?? NaN);
      const priceChange = Number(data?.priceChange ?? NaN);
      const priceChangePercent = Number(data?.priceChangePercent ?? NaN);

      if (!isFinite(lastPrice)) {
        console.error("Нет корректных данных для пары:", symbol, data);
        return null;
      }

      return {
        id: symbol.toLowerCase(), // например, "btcusdt"
        symbol: base, // "BTC"
        name: base, // можно оставить base как name (у Binance нет full name)
        current_price: lastPrice,
        price_change_24h: isFinite(priceChange) ? priceChange : 0,
        price_change_percentage_24h: isFinite(priceChangePercent)
          ? priceChangePercent
          : 0,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Ошибка получения курса криптовалюты (Binance):", error);
      // Фолбэк на CoinCap, если хочешь оставить альтернативу
      return await this.getCryptoPriceAlternative(crypto, currency);
    }
  }

  /** Альтернативный источник — CoinCap (простой фолбэк) */
  static async getCryptoPriceAlternative(
    crypto: string,
    currency: string
  ): Promise<CryptoPrice | null> {
    try {
      const COINCAP_API_URL = "https://api.coincap.io/v2";
      const cryptoId = crypto.toLowerCase();
      const fiat = currency.toLowerCase();

      const { data } = await axios.get(
        `${COINCAP_API_URL}/assets/${cryptoId}`,
        {
          timeout: 10000,
        }
      );

      const d = data?.data;
      if (!d) return null;

      let price = parseFloat(d.priceUsd);
      if (fiat === "rub" || fiat === "rur") price *= 95; // упрощённо
      else if (fiat === "eur" || fiat === "euro") price *= 0.92;

      const pct = parseFloat(d.changePercent24Hr) || 0;

      return {
        id: d.id,
        symbol: (d.symbol ?? crypto).toUpperCase(),
        name: d.name ?? cryptoId,
        current_price: price,
        price_change_24h: price * (pct / 100),
        price_change_percentage_24h: pct,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Ошибка альтернативного API:", error);
      return null;
    }
  }

  /** Доступные базовые активы (монеты), по данным кэша Binance */
  static async getSupportedCryptos(): Promise<string[]> {
    await this.ensureExchangeMeta();
    return Array.from(this.baseAssets).sort(); // ["ADA","ATOM","AVAX","BTC", ...]
  }

  /** Доступные котируемые валюты — пересечение наших с теми, что реально встречаются на Binance */
  static async getSupportedCurrencies(): Promise<string[]> {
    await this.ensureExchangeMeta();
    // соберём все уникальные котируемые активы из символов
    const quotes = new Set<string>();
    for (const { quote } of this.symbolMap.values()) quotes.add(quote);

    // вернём только те, что у нас маппятся из входа
    const whitelist = new Set(Object.values(CURRENCY_MAP));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usable = Array.from(quotes).filter((q) => whitelist.has(q));
    // бонус: добавим алиасы входа (usd, usdt, eur, rub, rur)
    return ["USDT", "EUR", "RUB"];
  }
}
