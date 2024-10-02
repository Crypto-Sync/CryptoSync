export interface CryptoPrices {
  eth: number | null;
  tron: number | null;
  btc: number | null;
}

export const fetchCryptoPrices = async (): Promise<CryptoPrices> => {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tron,bitcoin&vs_currencies=usd",
    { next: { revalidate: 60 } } // Cache and revalidate every 60 seconds
  );

  if (!res.ok) {
    throw new Error("Failed to fetch prices");
  }

  const data = await res.json();
  return {
    eth: data.ethereum?.usd ?? null,
    tron: data.tron?.usd ?? null,
    btc: data.bitcoin?.usd ?? null,
  };
};
