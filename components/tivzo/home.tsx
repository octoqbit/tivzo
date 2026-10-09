import { CalendarDays, Ticket, ScanLine, Users } from "lucide-react";
import MarketingShell from "@/components/marketing/shell";
const features = [
  {
    title: "Your event, your world.",
    text: "Create event pages with the details your guests need, from the venue to the final available spot.",
    icon: CalendarDays,
  },
  {
    title: "One link. They're in.",
    text: "Share registration and give every guest a unique QR ticket. No participant account required.",
    icon: Ticket,
  },
  {
    title: "Scan. Welcome. Repeat.",
    text: "Keep the camera open and check tickets automatically. See arrivals together in one workspace.",
    icon: ScanLine,
  },
  {
    title: "Give your crew a role.",
    text: "Manage your club's events and assign volunteers to the entrances they need to cover.",
    icon: Users,
  },
];
const faqs = [
  [
    "Do guests need an account?",
    "No. A guest enters their name and email on the event registration page, then saves their QR ticket.",
  ],
  [
    "Can more than one phone scan tickets?",
    "The shared check-in design allows multiple authorized phones to use the same event list. The operating target is two phones normally and up to five after real-device and load testing.",
  ],
  [
    "Is Tivzo ready for my live event?",
    "This is a working preview with sample data. Live registration needs the backend and security checks connected, followed by testing at your venue. Sample tickets do not admit guests.",
  ],
  [
    "Can I export attendance?",
    "Organizers can download guest and attendance reports. Automatic Google Drive archiving is planned and is not connected in this preview.",
  ],
];
export default function Home() {
  return (
    <MarketingShell>
      <main id="main">
        <section className="craft-hero">
          <div className="craft-hero-copy">
            <p className="craft-eyebrow">YOUR NEXT GREAT GATHERING</p>
            <h1>
              Build the event.
              <br />
              <span>Bring the people.</span>
            </h1>
            <p className="craft-lead">
              From the first invite to the last check-in. A shared home for your
              events, guests and the crew making it happen.
            </p>
            <div className="craft-actions">
              <a href="/workspace" className="pixel-button">
                Start project
              </a>
              <a href="#features" className="craft-text-link">
                Explore the features
              </a>
            </div>
            <p className="craft-preview">
              Explore with sample data. Live event setup comes next.
            </p>
          </div>
          <figure className="craft-hero-art">
            <img
              src="/images/tivzo-voxel-festival.png"
              width="1536"
              height="1024"
              alt="A playful block-built festival with an orange entry arch, a stage and friends gathering on grassy terraces."
              fetchPriority="high"
            />
            <figcaption>YOUR WORLD. YOUR PEOPLE. YOUR EVENT.</figcaption>
          </figure>
        </section>
        <div className="craft-strip">
          <span>CLUB MEETUPS</span>
          <span>CAMPUS FESTS</span>
          <span>WORKSHOPS</span>
          <span>COMMUNITY NIGHTS</span>
        </div>
        <section className="craft-section" id="features">
          <div className="craft-section-heading">
            <p className="craft-eyebrow">THE BUILDING BLOCKS</p>
            <h2>
              Less juggling.
              <br />
              More gathering.
            </h2>
            <p>Keep the moving parts of an event in one place.</p>
          </div>
          <div className="craft-features">
            {features.map(({ title, text, icon: Icon }, i) => (
              <article className="craft-feature" key={title}>
                <div className="craft-feature-top">
                  <Icon size={28} strokeWidth={1.6} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="craft-process craft-section">
          <div>
            <p className="craft-eyebrow">FROM IDEA TO OPEN DOORS</p>
            <h2>
              Three steps.
              <br />
              One good time.
            </h2>
          </div>
          <ol>
            {[
              [
                "Create your event",
                "Choose the date, venue and guest capacity.",
              ],
              [
                "Share your invitation",
                "Send your registration link and let guests save their tickets.",
              ],
              [
                "Welcome your people",
                "Assign your crew, start scanning and follow attendance.",
              ],
            ].map(([title, text], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="craft-about craft-section" id="about">
          <div>
            <p className="craft-eyebrow">ABOUT TIVZO</p>
            <h2>
              Good events start
              <br />
              with good people.
            </h2>
          </div>
          <div>
            <p className="craft-lead">
              Tivzo is being built for clubs, campus organizers and communities
              who want to spend more time bringing people together.
            </p>
            <p>
              Our focus is simple: clear registration, useful guest lists and a
              calmer welcome at the door. Organizers get a workspace for their
              events. Volunteers get the tools they need to check guests in.
            </p>
            <p>
              We're starting with the essentials and testing them carefully
              before live events. This preview is your first look at that work.
            </p>
            <a className="craft-text-link" href="/workspace">
              Explore the workspace
            </a>
            <div className="craft-contacts">
              <a href="mailto:help@tivzo.in">Support: help@tivzo.in</a>
              <a href="mailto:info@tivzo.in">Say hello: info@tivzo.in</a>
            </div>
          </div>
        </section>
        <section className="craft-faq craft-section" id="faq">
          <div>
            <p className="craft-eyebrow">BEFORE YOU JUMP IN</p>
            <h2>
              A few good
              <br />
              questions.
            </h2>
          </div>
          <div>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="craft-cta">
          <div>
            <p className="craft-eyebrow">MAKE SOMETHING WORTH SHOWING UP FOR</p>
            <h2>
              Your next event
              <br />
              starts here.
            </h2>
          </div>
          <a href="/workspace" className="pixel-button">
            Start project
          </a>
        </section>
      </main>
    </MarketingShell>
  );
}
