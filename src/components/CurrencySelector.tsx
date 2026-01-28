"use client";

import { useState, useMemo } from "react";
import { FIAT_OPTIONS } from "../services/cryptoService";
import styles from "./CurrencySelector.module.scss";

interface CurrencySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currentCode: string;
  rateText: string | null;
}

export function CurrencySelector({
  isOpen,
  onClose,
  onSelect,
  currentCode,
  rateText,
}: CurrencySelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return FIAT_OPTIONS;
    const q = search.trim().toLowerCase();
    return FIAT_OPTIONS.filter(
      (f) =>
        f.code.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (code: string) => {
    onSelect(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Валюты">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {rateText && <p className={styles.rateText}>{rateText}</p>}
        <h2 className={styles.modalTitle}>Валюты</h2>
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
        <ul className={styles.list}>
          {filtered.map((f) => (
            <li key={f.code}>
              <button
                type="button"
                className={`${styles.item} ${f.code === currentCode ? styles.itemActive : ""}`}
                onClick={() => handleSelect(f.code)}
              >
                <span className={styles.itemSymbol}>{f.symbol}</span>
                <span className={styles.itemCode}>{f.code.toUpperCase()}</span>
                {f.code === currentCode && <span className={styles.check} aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
