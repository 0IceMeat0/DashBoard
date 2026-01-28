const COINGECKO_IMAGES = "https://assets.coingecko.com/coins/images";

/** URL иконки криптовалюты по символу (small, цветная). Нет в списке — null, показываем fallback. */
export function getCryptoIconUrl(symbol: string): string | null {
  const key = symbol.toLowerCase();
  return CRYPTO_ICON_PATHS[key] ?? null;
}

const CRYPTO_ICON_PATHS: Record<string, string> = {
  btc: `${COINGECKO_IMAGES}/1/small/bitcoin.png`,
  eth: `${COINGECKO_IMAGES}/279/small/ethereum.png`,
  bnb: `${COINGECKO_IMAGES}/825/small/bnb-icon2_2x.png`,
  sol: `${COINGECKO_IMAGES}/4128/small/solana.png`,
  xrp: `${COINGECKO_IMAGES}/44/small/xrp-symbol-white-128.png`,
  usdt: `${COINGECKO_IMAGES}/325/small/Tether.png`,
  usdc: `${COINGECKO_IMAGES}/6319/small/usdc.png`,
  doge: `${COINGECKO_IMAGES}/5/small/dogecoin.png`,
  ada: `${COINGECKO_IMAGES}/975/small/cardano.png`,
  avax: `${COINGECKO_IMAGES}/12559/small/Avalanche_Circle_RedWhite_Trans.png`,
  trx: `${COINGECKO_IMAGES}/10915/small/tron-logo.png`,
  link: `${COINGECKO_IMAGES}/877/small/chainlink-new-logo.png`,
  ton: `${COINGECKO_IMAGES}/17980/small/ton_symbol.png`,
  dot: `${COINGECKO_IMAGES}/12171/small/polkadot.png`,
  matic: `${COINGECKO_IMAGES}/4713/small/matic-token-icon.png`,
  ltc: `${COINGECKO_IMAGES}/2/small/litecoin.png`,
  shib: `${COINGECKO_IMAGES}/11939/small/shiba.png`,
  dai: `${COINGECKO_IMAGES}/9956/small/Badge_Dai.png`,
  uni: `${COINGECKO_IMAGES}/12504/small/uni-app-icon.png`,
  atom: `${COINGECKO_IMAGES}/1481/small/cosmos_hub.png`,
  near: `${COINGECKO_IMAGES}/10365/small/near.jpg`,
  apt: `${COINGECKO_IMAGES}/26455/small/aptos_round.png`,
  arb: `${COINGECKO_IMAGES}/16547/small/photo_2023-03-29_21.47.00.jpeg`,
  op: `${COINGECKO_IMAGES}/25244/small/Optimism.png`,
  inj: `${COINGECKO_IMAGES}/12863/small/Secondary_Symbol.png`,
  fil: `${COINGECKO_IMAGES}/228/small/filecoin.png`,
  stx: `${COINGECKO_IMAGES}/2069/small/Stacks_logo_full.png`,
  imx: `${COINGECKO_IMAGES}/17233/small/immutable-X-symbol-BLK.png`,
  sui: `${COINGECKO_IMAGES}/26375/small/sui_asset.jpeg`,
  sei: `${COINGECKO_IMAGES}/28205/small/Sei_Logo_-_Transparent.png`,
  wld: `${COINGECKO_IMAGES}/25124/small/worldcoin.jpeg`,
  fdusd: `${COINGECKO_IMAGES}/26181/small/fdusd.png`,
  pepe: `${COINGECKO_IMAGES}/29850/small/pepe-token.jpeg`,
  wbtc: `${COINGECKO_IMAGES}/7598/small/wrapped_bitcoin_wbtc.png`,
  steth: `${COINGECKO_IMAGES}/13442/small/steth_logo.png`,
};
