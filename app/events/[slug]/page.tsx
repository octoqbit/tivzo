import Registration from "@/components/tivzo/registration";
export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Registration slug={slug} />;
}
