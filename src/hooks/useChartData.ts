import { useState, useEffect } from "react";
import { ChartService, ChartDataPoint } from "../services/chartService";

interface UseChartDataProps {
  crypto: string;
  currency: string;
  period: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useChartData = ({
  crypto,
  currency,
  period,
  autoRefresh = true,
  refreshInterval = 600000, // 10 минута
}: UseChartDataProps) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ChartService.getHistoricalData(
        crypto,
        currency,
        period
      );

      if (result.error) {
        setError(result.error);
      }

      setData(result.data);
    } catch (err) {
      console.error("Ошибка в fetchData:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [crypto, currency, period, autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
