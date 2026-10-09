import Policy from "@/components/marketing/policy";
export const metadata = { title: "Terms of Service — Tivzo" };
export default function TermsPage() {
  return (
    <Policy title="Terms of service">
      <section>
        <h2>1. The service and its preview status</h2>
        <p>
          Tivzo is an event-management application for organizers, volunteers
          and participants. The current preview lets you explore sample
          workflows. Sample tickets are not valid for entry, sample changes may
          reset, and no paid subscription or payment processing is offered in
          this version.
        </p>
        <p>
          These are draft service terms for review. The operator's legal
          identity and applicable jurisdiction must be confirmed before
          commercial launch or live registration.
        </p>
      </section>
      <section>
        <h2>2. Organizer responsibilities</h2>
        <p>
          You are responsible for accurate event details, necessary venue
          permissions, your event's rules and the lawful collection and use of
          guest information. Share relevant privacy and retention information
          with guests. Only add volunteers who are authorized to work on your
          events.
        </p>
        <p>
          Tivzo does not organize, supervise or guarantee the safety of events
          created by users. Event-specific cancellations, admission decisions
          and any refunds are the organizer's responsibility, subject to
          applicable law.
        </p>
      </section>
      <section>
        <h2>3. Accounts and acceptable use</h2>
        <p>
          Use accounts you are authorized to access and protect your
          credentials. Do not impersonate another organizer, access another
          club's records without permission, distribute other people's ticket
          secrets, submit unlawful content or interfere with the service.
        </p>
        <p>
          Use participant reports only for the event purposes disclosed to
          guests. Do not sell, publish or repurpose guest details without a
          lawful basis.
        </p>
      </section>
      <section>
        <h2>4. Tickets and check-in</h2>
        <p>
          A QR ticket relates to one registration for one event. Keep it
          private. Sharing it may let someone else attempt entry first. The
          organizer's entry rules still apply.
        </p>
        <p>
          Live verification requires a working connection and a confirmed server
          response. Test your phones, network and backup entry arrangements
          before an event. Offline admission and five-phone performance have not
          been validated in this preview.
        </p>
      </section>
      <section>
        <h2>5. Content and ownership</h2>
        <p>
          You retain rights in content you provide and must have permission to
          use it. You allow the configured service providers to process it as
          needed to operate your event and workspace. The Tivzo name and
          original site materials are not a licence to represent yourself as the
          Tivzo operator.
        </p>
        <p>
          The site's voxel theme is an original visual treatment and does not
          imply any affiliation with Minecraft or Mojang.
        </p>
      </section>
      <section>
        <h2>6. Availability, changes and ending use</h2>
        <p>
          The preview may change or become unavailable and carries no uptime or
          throughput commitment. Do not rely on it as the sole admission system
          for a real event. Features shown as planned are not current services.
        </p>
        <p>
          You may stop using the preview at any time. Contact support for
          account or data requests when live accounts are enabled. Downloading a
          report does not automatically archive or delete the original records.
        </p>
      </section>
      <section>
        <h2>7. Applicable rights and future terms</h2>
        <p>
          Nothing on this page is intended to remove rights that cannot be
          excluded under applicable law. Any future paid offering, service
          commitments and dispute arrangements will need their own finalized
          terms. Material changes will be reflected in the version date and
          communicated as appropriate before live use.
        </p>
      </section>
    </Policy>
  );
}
