import { BitcoinHalvingCountdown } from "../../components/BitcoinHalvingCountdown";
import styles from "./page.module.scss";

export default function TimeBtcPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <BitcoinHalvingCountdown />
      </div>
    </div>
  );
}

