import { notFound } from "next/navigation";
import RoomDetailClient from "@/components/RoomDetailClient";
import { fetchRoom, FIXTURE_ROOMS } from "@/lib/api";

export function generateStaticParams() {
  return FIXTURE_ROOMS.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await fetchRoom(slug);
  return { title: data?.name ?? "Room" };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: room, live, error } = await fetchRoom(slug);

  if (!room) {
    notFound();
  }

  return <RoomDetailClient room={room} live={live} error={error} />;
}
