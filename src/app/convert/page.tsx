"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Converter } from "../../components/Converter";
import { setCookie } from "../../utils/cookies";
import styles from "./page.module.scss";

function ConvertContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const timeOne = searchParams.get("time") === "one";
  const [initialCrypto] = useState<string | undefined>(
    () => type?.trim() || undefined
  );

  useEffect(() => {
    if (typeof window === "undefined" || !timeOne || !type?.trim()) return;
    setCookie("crypto", type.trim().toUpperCase());
  }, [timeOne, type]);

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
