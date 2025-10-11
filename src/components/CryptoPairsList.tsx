"use client";

import { CryptoService } from "../services/cryptoService";
import styles from "./CryptoPairsList.module.scss";

export const CryptoPairsList = () => {
  const cryptos = CryptoService.getSupportedCryptos();
  const currencies = CryptoService.getSupportedCurrencies();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Доступные торговые пары</h2>
      
      <div className={styles.grid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Криптовалюты:</h3>
          <ul className={styles.list}>
            {cryptos.map((crypto) => (
              <li key={crypto} className={styles.listItem}>
                <code className={styles.code}>
                  {crypto}
                </code>
                <span className={styles.description}>
                  {crypto === 'btc' ? 'Bitcoin' :
                   crypto === 'eth' ? 'Ethereum' :
                   crypto === 'ton' ? 'TON' :
                   crypto === 'sol' ? 'Solana' :
                   crypto === 'ada' ? 'Cardano' :
                   crypto === 'dot' ? 'Polkadot' :
                   crypto === 'matic' ? 'Polygon' :
                   crypto === 'avax' ? 'Avalanche' :
                   crypto === 'link' ? 'Chainlink' :
                   crypto === 'atom' ? 'Cosmos' : crypto}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Валюты:</h3>
          <ul className={styles.list}>
            {currencies.map((currency) => (
              <li key={currency} className={styles.listItem}>
                <code className={styles.code}>
                  {currency}
                </code>
                <span className={styles.description}>
                  {currency === 'usd' ? 'USDT (Tether)' :
                   currency === 'rub' ? 'Российский рубль' :
                   currency === 'euro' || currency === 'eur' ? 'Евро' : currency}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.examplesSection}>
        <h4 className={styles.examplesTitle}>Примеры URL:</h4>
        <div className={styles.examplesGrid}>
          <code className={styles.example}>
            ?type=btc&amp;money=usd - Bitcoin/USDT
          </code>
          <code className={styles.example}>
            ?type=eth&amp;money=rub - Ethereum/RUB
          </code>
          <code className={styles.example}>
            ?type=sol&amp;money=euro - Solana/EUR
          </code>
        </div>
      </div>

      <div className={styles.note}>
        <p className={styles.noteText}>
          <strong>Примечание:</strong> Некоторые пары могут быть недоступны на Binance. 
          В таком случае автоматически используется резервный API (CoinCap).
        </p>
      </div>
    </div>
  );
};
