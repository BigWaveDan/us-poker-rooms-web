import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p className="lede">
        That page is not in this app, and this UI does not invent poker rooms.
      </p>
      <p>
        <Link href="/rooms">Back to rooms</Link>
      </p>
    </>
  );
}
