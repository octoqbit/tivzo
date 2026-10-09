"use client";
import { Moon, Sun } from "lucide-react";
import { Brand } from "@/components/tivzo/brand";
import { useTheme } from "@/lib/tivzo/use-theme";
import { CookieSettingsButton } from "./cookie-banner";
import "@fontsource/press-start-2p/latin-400.css";
export default function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dark, setDark] = useTheme();
  return (
    <div className="craft-site">
      <a className="home-skip" href="#main">
        Skip to content
      </a>
      <header className="craft-nav">
        <a href="/" aria-label="Tivzo home">
          <Brand />
        </a>
        <nav aria-label="Website navigation">
          <a href="/#features">Features</a>
          <a href="/#about">About us</a>
          <a href="/#faq">FAQs</a>
          <button
            className="craft-theme"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <a className="pixel-button small" href="/workspace">
            Start project
          </a>
        </nav>
      </header>
      {children}
      <footer className="craft-footer">
        <div className="craft-footer-top">
          <div>
            <Brand />
            <p>
              Build the event.
              <br />
              Bring the people.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="/#about">About us</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of service</a>
            <a href="/cookies">Cookie policy</a>
            <CookieSettingsButton />
            <a href="mailto:help@tivzo.in">help@tivzo.in</a>
            <a href="mailto:info@tivzo.in">info@tivzo.in</a>
          </nav>
        </div>
        <div className="craft-footer-bottom">
          <span>© {new Date().getFullYear()} Tivzo · Preview edition</span>
          <span>
            Original voxel artwork. Not affiliated with Minecraft or Mojang.
          </span>
        </div>
      </footer>
    </div>
  );
}
