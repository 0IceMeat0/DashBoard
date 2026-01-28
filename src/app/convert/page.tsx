"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Converter } from "../../components/Converter";
import styles from "./page.module.scss";

function ConvertContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const initialCrypto = type?.trim() || undefined;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Converter key={initialCrypto ?? "default"} initialCrypto={initialCrypto} />
      </div>
    </div>
  );
}

export default function ConvertPage() {
  return (
    <Suspense fallback={<div className={styles.container} />}>
      <ConvertContent />
    </Suspense>
  );
}
