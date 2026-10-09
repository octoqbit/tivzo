export type EventRecord = {
  id: string;
  name: string;
  slug: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  status: "published" | "draft" | "closed";
  capacity: number;
  description: string;
  accent: string;
  registered: number;
  checked: number;
  organization_id?: string;
};
export type Guest = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  created_at: string;
  checked_at: string | null;
  token?: string;
};
export type View =
  | "overview"
  | "events"
  | "guests"
  | "scanner"
  | "team"
  | "settings"
  | "archives";
export const demoEvents: EventRecord[] = [
  {
    id: "e1",
    name: "FORM / 26",
    slug: "form-26",
    date: "2026-10-24",
    time: "17:00",
    venue: "The Main Auditorium",
    category: "Design & culture",
    status: "published",
    capacity: 500,
    description:
      "An evening for the ones who see things differently. Talks, ideas and conversations at the intersection of design and culture.",
    accent: "orange",
    registered: 342,
    checked: 0,
  },
  {
    id: "e2",
    name: "After Hours",
    slug: "after-hours",
    date: "2026-10-30",
    time: "18:00",
    venue: "The Courtyard",
    category: "Music & community",
    status: "published",
    capacity: 300,
    description:
      "Good music. Better company. Come together for an evening of independent artists, live sets and new connections.",
    accent: "blue",
    registered: 218,
    checked: 0,
  },
  {
    id: "e3",
    name: "Build Something.",
    slug: "build-something",
    date: "2026-11-07",
    time: "09:00",
    venue: "Innovation Lab",
    category: "Technology",
    status: "draft",
    capacity: 150,
    description:
      "A day to turn your ideas into something real. Bring your curiosity and build alongside a community of makers.",
    accent: "green",
    registered: 0,
    checked: 0,
  },
];
export const demoGuests: Guest[] = [
  "Aarav Mehta",
  "Isha Kapoor",
  "Kabir Shah",
  "Ananya Rao",
  "Rohan Das",
  "Meera Nair",
  "Dev Patel",
  "Sara Khan",
].map((name, i) => ({
  id: `g${i}`,
  event_id: i % 3 === 0 ? "e2" : "e1",
  name,
  email: name.toLowerCase().replace(" ", ".") + "@example.com",
  created_at: `2026-10-08T${String(9 + i).padStart(2, "0")}:24:00Z`,
  checked_at: null,
  token: `tivzo:demo-guest-${i}`,
}));
