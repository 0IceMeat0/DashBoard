"use client";

import { useState, useEffect, useMemo } from "react";
import { CryptoService } from "../services/cryptoService";
import styles from "./CoinSelector.module.scss";

interface CoinSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  currentSymbol: string;
}

export function CoinSelector({
  isOpen,
  onClose,
  onSelect,
  currentSymbol,
}: CoinSelectorProps) {
  const [search, setSearch] = useState("");
  const [list, setList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    CryptoService.getSupportedCryptos()
      .then((symbols) => {
        setList(symbols);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toUpperCase();
    return list.filter((s) => s.toUpperCase().includes(q));
  }, [list, search]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Монеты">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Монеты</h2>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>⌕</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.listWrap}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          ) : (
            <ul className={styles.list}>
              {filtered.map((symbol) => (
                <li key={symbol}>
                  <button
                    type="button"
                    className={`${styles.item} ${symbol === currentSymbol ? styles.itemActive : ""}`}
                    onClick={() => handleSelect(symbol)}
                  >
                    <span className={styles.itemSymbol}>{symbol}</span>
                    {symbol === currentSymbol && <span className={styles.check} aria-hidden>✓</span>}
                  </button>
                </li>
              ))}
              {!loading && filtered.length === 0 && (
                <li className={styles.empty}>Ничего не найдено</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
