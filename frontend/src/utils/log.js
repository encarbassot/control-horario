const production = import.meta.env.PROD;

export default function log(...params) {
  const debugEnabled = localStorage.getItem("debug") === "true";

  if (!production || debugEnabled) {
    console.log(...params);
  }
}