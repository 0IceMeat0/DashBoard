const CHANNEL_NAME = "altcoinlog-crypto";

export type CryptoMessage = { type: "crypto-changed"; crypto: string };

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

/** Отправить выбранную крипту во все вкладки/iframe того же origin */
export function broadcastCrypto(crypto: string): void {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: "crypto-changed", crypto } satisfies CryptoMessage);
    } finally {
      ch.close();
    }
  }
}

/** Подписаться на смену крипты из других вкладок/iframe */
export function subscribeCrypto(callback: (crypto: string) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<CryptoMessage>) => {
    if (event.data?.type === "crypto-changed" && typeof event.data.crypto === "string") {
      callback(event.data.crypto.trim().toLowerCase());
    }
  };
  ch.addEventListener("message", handler);
  return () => {
    ch.removeEventListener("message", handler);
    ch.close();
  };
}
