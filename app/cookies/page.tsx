import Policy from "@/components/marketing/policy";
import { CookieSettingsButton } from "@/components/marketing/cookie-banner";
export const metadata = { title: "Cookie Policy — Tivzo" };
export default function CookiesPage() {
  return (
    <Policy title="Cookie policy">
      <section>
        <h2>Cookies and browser storage</h2>
        <p>
          Cookies and similar browser storage help websites remember
          information. Tivzo uses browser storage for settings you request and,
          when connected, staff sign-in. The application does not currently
          enable optional analytics or advertising trackers.
        </p>
      </section>
      <section>
        <h2>What the application stores</h2>
        <ul>
          <li>
            <code>tivzo-theme</code>: remembers the light or dark theme you
            choose on this device. It stays until you change it or clear site
            storage.
          </li>
          <li>
            <code>tivzo-storage-notice-v1</code>: records that you selected
            “Essential only,” together with the notice version and time. The
            notice is shown again after 180 days or when its version changes.
            The saved entry remains until replaced or cleared.
          </li>
          <li>
            Supabase authentication storage: when live staff sign-in is
            configured, the authentication provider stores and refreshes session
            information needed to keep you signed in. Its keys depend on the
            connected project. Signing out clears the local session; browser
            storage can also be cleared manually.
          </li>
        </ul>
      </section>
      <section>
        <h2>Hosting and security services</h2>
        <p>
          The hosting service may use its own required access or security
          cookies, including for access to this private preview. Cloudflare
          Turnstile is loaded on live registration pages when configured to help
          protect forms from abuse. Those services have their own storage rules
          and privacy notices; their exact deployed cookie inventory must be
          verified before public launch.
        </p>
        <p>
          The “Essential only” button records your preference for the Tivzo
          application. It does not change browser-wide settings or the hosting
          provider's separate sign-in preferences, and it does not disable a
          theme setting you explicitly chose.
        </p>
      </section>
      <section>
        <h2>Your controls</h2>
        <p>
          You can reopen the notice below or through “Cookie settings” in the
          footer. There are currently no optional tracking categories to turn
          on. Any future optional tracking must remain off until a separate
          choice is offered.
        </p>
        <p>
          You can remove site data through your browser settings. Blocking all
          browser storage may prevent sign-in from persisting and may make the
          notice reappear. If saving is blocked, dismissing the banner works for
          the current page visit only.
        </p>
        <CookieSettingsButton />
      </section>
    </Policy>
  );
}
