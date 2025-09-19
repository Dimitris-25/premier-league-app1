// Augment the Window type for the API-Football widget
export {};

declare global {
  interface Window {
    apifootballWidget?: {
      reload?: () => void;
    };
  }
}
