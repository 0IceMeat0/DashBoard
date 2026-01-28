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

const EXCHANGERATE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

// нормализуем входящие валюты → котируемые активы Binance (RUB на Binance нет — считаем сами)
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

    // 3) если указанная котируемая валюта не торгуется с base — попробуем автоподбор (RUB на Binance нет)
    const fallbackQuotes = ["USDT", "BUSD", "FDUSD", "EUR", "TRY"];
    for (const q of fallbackQuotes) {
      if (quotes && quotes.has(q)) {
        return { symbol: `${base}${q}`, base, quote: q };
      }
    }

    // 4) не нашли пару
    return null;
  }

  /** Курс USD (USDT) → RUB через внешний API (на Binance рубля нет) */
  private static usdToRubCache: { rate: number; expiresAt: number } | null = null;
  private static readonly USD_TO_RUB_CACHE_MS = 10 * 60 * 1000; // 10 мин

  private static async getUsdToRubRate(): Promise<number | null> {
    const now = Date.now();
    if (
      this.usdToRubCache &&
      this.usdToRubCache.expiresAt > now
    ) {
      return this.usdToRubCache.rate;
    }
    try {
      const { data } = await axios.get<{ base: string; rates: Record<string, number> }>(
        EXCHANGERATE_API_URL,
        { timeout: 10000, headers: { Accept: "application/json" } }
      );
      const rate = data?.rates?.RUB;
      if (rate != null && isFinite(rate) && rate > 0) {
        this.usdToRubCache = { rate, expiresAt: now + this.USD_TO_RUB_CACHE_MS };
        return rate;
      }
    } catch (err) {
      console.error("Ошибка курса USD→RUB:", err);
    }
    return this.usdToRubCache?.rate ?? null;
  }

  /** Курс котируемого актива (USDT/EUR) в целевую фиатную валюту; для RUB используем внешний API */
  private static async getQuoteToFiatRate(
    quoteAsset: string,
    targetFiat: string
  ): Promise<number | null> {
    const targetNorm = (targetFiat || "").trim().toLowerCase();
    const targetQuote = (
      CURRENCY_MAP[targetNorm] || targetFiat.toUpperCase()
    ).toUpperCase();
    if (quoteAsset === targetQuote) return 1;

    if (targetNorm === "rub" || targetNorm === "rur") {
      if (quoteAsset === "USDT" || quoteAsset === "BUSD" || quoteAsset === "FDUSD") {
        return this.getUsdToRubRate();
      }
      return null;
    }

    const pair = `${quoteAsset}${targetQuote}`;
    const pairRev = `${targetQuote}${quoteAsset}`;
    await this.ensureExchangeMeta();
    const symbolToUse = this.symbolMap.has(pair)
      ? pair
      : this.symbolMap.has(pairRev)
        ? pairRev
        : null;
    if (!symbolToUse) return null;

    try {
      const { data } = await axios.get(`${BINANCE_API_URL}/ticker/24hr`, {
        params: { symbol: symbolToUse },
        timeout: 10000,
        headers: { Accept: "application/json" },
      });
      const price = Number(data?.lastPrice ?? NaN);
      if (!isFinite(price)) return null;
      return this.symbolMap.get(symbolToUse)?.base === quoteAsset
        ? price
        : 1 / price;
    } catch {
      return null;
    }
  }

  /** Основной метод получения цены с Binance; для RUB — цена в USDT × курс USD→RUB */
  static async getCryptoPrice(
    crypto: string,
    currency: string
  ): Promise<CryptoPrice | null> {
    const currencyNorm = (currency || "").trim().toLowerCase();
    const isRub = currencyNorm === "rub" || currencyNorm === "rur";

    try {
      const quoteForResolve = isRub ? "usd" : currency;
      const resolved = await this.resolveBinanceSymbol(crypto, quoteForResolve);
      if (!resolved) {
        throw new Error(
          `Пара недоступна на Binance: base=${crypto.toUpperCase()}, quote=${(
            CURRENCY_MAP[currencyNorm] || currency
          ).toUpperCase()}`
        );
      }

      const { symbol, base, quote } = resolved;
      const requestedQuote = (
        CURRENCY_MAP[currencyNorm] || currency.toUpperCase()
      ).toUpperCase();

      const { data } = await axios.get(`${BINANCE_API_URL}/ticker/24hr`, {
        params: { symbol },
        timeout: 15000,
        headers: { Accept: "application/json" },
      });

      let lastPrice = Number(data?.lastPrice ?? NaN);
      let priceChange = Number(data?.priceChange ?? NaN);
      const priceChangePercent = Number(data?.priceChangePercent ?? NaN);

      if (!isFinite(lastPrice)) {
        console.error("Нет корректных данных для пары:", symbol, data);
        return null;
      }

      if (quote !== requestedQuote) {
        const rate = await this.getQuoteToFiatRate(quote, requestedQuote);
        if (rate !== null && isFinite(rate)) {
          lastPrice *= rate;
          priceChange *= rate;
        }
      }

      return {
        id: symbol.toLowerCase(),
        symbol: base,
        name: base,
        current_price: lastPrice,
        price_change_24h: isFinite(priceChange) ? priceChange : 0,
        price_change_percentage_24h: isFinite(priceChangePercent)
          ? priceChangePercent
          : 0,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Ошибка получения курса криптовалюты (Binance):", error);
      return await this.getCryptoPriceAlternative(crypto, currency);
    }
  }

  /** Альтернативный источник — CoinCap (простой фолбэк); для RUB — курс USD→RUB из нашего API */
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
      if (fiat === "rub" || fiat === "rur") {
        const usdToRub = await this.getUsdToRubRate();
        price *= usdToRub ?? 95;
      } else if (fiat === "eur" || fiat === "euro") {
        const { data: rates } = await axios.get<{ rates: Record<string, number> }>(
          EXCHANGERATE_API_URL,
          { timeout: 5000 }
        ).catch(() => ({ data: null }));
        const eurRate = rates?.rates?.EUR;
        price *= eurRate != null && isFinite(eurRate) ? 1 / eurRate : 0.92;
      }

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

  /** Порядок популярных монет для отображения первыми в списке */
  private static readonly POPULAR_CRYPTO_ORDER = [
    "BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC", "DOGE", "ADA", "AVAX",
    "TRX", "LINK", "TON", "DOT", "MATIC", "LTC", "SHIB", "DAI", "UNI", "ATOM",
  ];

  /** Доступные базовые активы (монеты), по данным кэша Binance; популярные — в начале */
  static async getSupportedCryptos(): Promise<string[]> {
    await this.ensureExchangeMeta();
    const all = Array.from(this.baseAssets);
    const popular = this.POPULAR_CRYPTO_ORDER.filter((s) => all.includes(s));
    const rest = all.filter((s) => !this.POPULAR_CRYPTO_ORDER.includes(s)).sort();
    return [...popular, ...rest];
  }

  /** Доступные котируемые валюты — пересечение наших с теми, что реально встречаются на Binance */
  static async getSupportedCurrencies(): Promise<string[]> {
    await this.ensureExchangeMeta();
    const quotes = new Set<string>();
    for (const { quote } of this.symbolMap.values()) quotes.add(quote);
    return ["USDT", "EUR", "RUB"];
  }
}

export type FiatOption = { code: string; label: string; symbol: string };

export const FIAT_OPTIONS: FiatOption[] = [
  { code: "usd", label: "Доллар США", symbol: "$" },
  { code: "eur", label: "Евро", symbol: "€" },
  { code: "rub", label: "Российский рубль", symbol: "₽" },
];
