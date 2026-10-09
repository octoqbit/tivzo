import Policy from "@/components/marketing/policy";
export const metadata = { title: "Privacy Policy — Tivzo" };
export default function PrivacyPage() {
  return (
    <Policy title="Privacy policy">
      <section>
        <h2>1. What this notice covers</h2>
        <p>
          Tivzo provides tools for event registration, ticketing and attendance.
          This notice describes information handled by the application. Event
          organizers decide why they collect guest details and are responsible
          for explaining their own event-specific use. The legal identity of the
          Tivzo operator will be added before launch.
        </p>
        <p>
          The current preview uses sample event data. Its sample registration
          form does not save participant details to a live event database. The
          hosting provider may still process connection and sign-in information
          needed to serve and protect this private website.
        </p>
      </section>
      <section>
        <h2>2. Information used when live services are enabled</h2>
        <ul>
          <li>
            Organizers and volunteers: account email, authentication credentials
            handled by the sign-in provider, workspace membership and event
            permissions.
          </li>
          <li>
            Guests: name, email, event registration, ticket identifier and
            check-in status.
          </li>
          <li>
            Attendance: event, time of entry and the authorized staff account
            that performed check-in.
          </li>
          <li>
            Website operations: connection information processed by hosting and
            security services, and browser preferences described in our{" "}
            <a href="/cookies">cookie policy</a>.
          </li>
        </ul>
        <p>
          QR camera access is requested on the scanning device. The app decodes
          camera frames locally and sends the ticket token for verification; its
          scanner does not upload camera video.
        </p>
      </section>
      <section>
        <h2>3. Why information is used</h2>
        <p>
          Information supports staff sign-in, event registration, QR
          verification, duplicate-entry prevention, attendance reporting and
          security. Live processing purposes and applicable legal grounds must
          be finalized with the operator and event organizer before collecting
          real guest data.
        </p>
        <p>
          No advertising or optional analytics trackers are enabled in the Tivzo
          application. Guest email is not used by this preview for marketing or
          automated ticket email delivery.
        </p>
      </section>
      <section>
        <h2>4. Access and service providers</h2>
        <p>
          Organizers can access and export data for events they manage. Assigned
          volunteers can verify tickets for their events. When configured,
          Supabase provides authentication and database services, and Cloudflare
          Turnstile checks registration requests for abuse. This site is hosted
          through Sites.
        </p>
        <p>
          These providers process information under their own service terms and
          privacy notices. Hosting regions and any international transfer
          arrangements will be documented before live launch. Google Drive
          archive uploads are not connected in this preview.
        </p>
      </section>
      <section>
        <h2>5. Retention and event exports</h2>
        <p>
          There is no automatic event-data deletion or fixed live retention
          schedule in this preview. Before an event opens, the organizer must
          publish how long registrations and attendance will be kept. Downloaded
          reports are separate copies under the organizer's control and need
          their own retention and access rules.
        </p>
        <p>
          Browser preferences remain on your device as described in the cookie
          policy. Clearing browser storage removes those local preferences; it
          does not delete records held by an organizer.
        </p>
      </section>
      <section>
        <h2>6. Your requests</h2>
        <p>
          Depending on applicable law, you may have rights to access, correct,
          delete or otherwise control your personal information, and to complain
          to the relevant data-protection authority. Contact your event
          organizer for event records, or{" "}
          <a href="mailto:help@tivzo.in">help@tivzo.in</a> for Tivzo-related
          requests. We may need to verify your identity before handling a
          request.
        </p>
      </section>
      <section>
        <h2>7. Children and updates</h2>
        <p>
          Organizers must apply appropriate age requirements, notices and
          permissions for their audience before collecting children's
          information. The preview is not a launch-ready registration service
          for children.
        </p>
        <p>
          This notice will be updated as live services and operator details are
          confirmed. The date above identifies this version.
        </p>
      </section>
    </Policy>
  );
}
