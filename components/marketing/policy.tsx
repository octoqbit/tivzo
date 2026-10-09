import MarketingShell from "./shell";
export default function Policy({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <main id="main" className="policy-page">
        <p className="craft-eyebrow">TIVZO / TRUST & TRANSPARENCY</p>
        <h1>{title}</h1>
        <p className="policy-intro">Last updated: 9 October 2026</p>
        <div className="policy-note">
          Preview edition. These pages describe the current product and its
          planned live use. Operator identity, applicable jurisdiction and live
          data-retention periods still need to be confirmed before public
          registration opens.
        </div>
        {children}
        <section>
          <h2>Contact Tivzo</h2>
          <p>
            For support or privacy requests, email{" "}
            <a href="mailto:help@tivzo.in">help@tivzo.in</a>. For general
            enquiries, email <a href="mailto:info@tivzo.in">info@tivzo.in</a>.
          </p>
        </section>
      </main>
    </MarketingShell>
  );
}
