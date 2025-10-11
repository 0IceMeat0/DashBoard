"use client";

import { useSearchParams } from "next/navigation";
import { CryptoPriceDisplay } from "../../components/CryptoPriceDisplay";
import styles from "./Header.module.scss";
import Image from "next/image";
import logo from "./assets/alt.png";
import bybit from "./assets/bybit.svg";
import Link from "next/link";

export const Header = () => {
  const searchParams = useSearchParams();

  // Получаем параметры из URL или используем значения по умолчанию
  const crypto = searchParams.get("type") ?? "btc";
  const currency = searchParams.get("money") ?? "usd";

  return (
    <div className={styles.wrap}>
      <div className={styles.typeCrypto}>
        <CryptoPriceDisplay crypto={crypto} currency={currency} />
      </div>
      <div className={styles.logo}>
        <Link href="https://altcoinlog.com/?utm_source=dashboard">
          <Image className={styles.logoAlt} src={logo} alt="AltCoinLog" />
        </Link>
        <Link href="https://www.bybit.com/en/">
          <Image className={styles.bybit} src={bybit} alt="Bybit" />
        </Link>
      </div>
    </div>
  );
};
