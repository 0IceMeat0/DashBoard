const COOKIE_PATH = "/";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, path = COOKIE_PATH): void {
  if (typeof document === "undefined") return;
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; path=" +
    path +
    "; max-age=31536000; SameSite=Lax";
}
