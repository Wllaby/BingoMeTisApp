export function useInterstitialAd() {
  return {
    loaded: false,
    load: () => {},
    show: async () => {},
  };
}
