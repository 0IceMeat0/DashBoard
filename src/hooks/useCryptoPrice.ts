import { useState, useEffect } from "react";
import { CryptoService, CryptoPrice } from "../services/cryptoService";

interface UseCryptoPriceProps {
  crypto: string;
  currency: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useCryptoPrice = ({
  crypto,
  currency,
  autoRefresh = true,
  refreshInterval = 600000, // 10мин секунд
}: UseCryptoPriceProps) => {
  const [data, setData] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    try {
      console.log("Начинаем загрузку данных для:", { crypto, currency });
      setLoading(true);
      setError(null);
      const result = await CryptoService.getCryptoPrice(crypto, currency);

      console.log("Результат запроса:", result);

      if (result) {
        setData(result);
        console.log("Данные установлены в состояние");
      } else {
        setError("Не удалось получить данные о курсе");
        console.log("Ошибка: результат null");
      }
    } catch (err) {
      console.error("Ошибка в fetchPrice:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();

    if (autoRefresh) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [crypto, currency, autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchPrice,
  };
};
