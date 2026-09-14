// Coins: strip trailing zeros (1.20 -> "1.2", 100.00 -> "100"), keep thousands grouping.
const coinsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export const formatCoins = (value: number): string =>
  coinsFormatter.format(value);

export const formatNumber = (value: number): string =>
  numberFormatter.format(value);

export const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export const formatDateTime = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
