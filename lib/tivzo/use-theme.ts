"use client";
import { useEffect, useState } from "react";
export function useTheme() {
  const [dark, updateDark] = useState(false);
  useEffect(() => {
    let saved = document.documentElement.dataset.theme === "dark";
    try {
      saved = localStorage.getItem("tivzo-theme") === "dark";
    } catch {}
    updateDark(saved);
    document.documentElement.dataset.theme = saved ? "dark" : "light";
    const sync = () =>
      updateDark(document.documentElement.dataset.theme === "dark");
    window.addEventListener("tivzo:theme", sync);
    return () => window.removeEventListener("tivzo:theme", sync);
  }, []);
  function setDark(next: boolean) {
    updateDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.dispatchEvent(new Event("tivzo:theme"));
    try {
      localStorage.setItem("tivzo-theme", next ? "dark" : "light");
    } catch {}
  }
  return [dark, setDark] as const;
}
