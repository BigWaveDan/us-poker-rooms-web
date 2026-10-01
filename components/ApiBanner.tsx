function isExpectedOffline(error?: string): boolean {
  if (!error) return false;
  const e = error.toLowerCase();
  return (
    e.includes("offline snapshot") ||
    e.includes("not found in snapshot") ||
    e === "offline"
  );
}

export default function ApiBanner({
  live,
  error,
}: {
  live: boolean;
  error?: string;
}) {
  if (live) {
    return (
      <div className="banner" role="status">
        Live API connected. Showing sourced rooms only — coverage gaps stay
        visible.
      </div>
    );
  }

  // GitHub Pages / static export always uses USE_OFFLINE_SNAPSHOT — calm status.
  if (isExpectedOffline(error) || !error) {
    return (
      <div className="banner" role="status">
        Using offline snapshot. Full room dataset from{" "}
        <code>lib/rooms-snapshot.json</code> (synced from <code>poker.db</code>
        ). Local edits in Settings stay in this browser.
      </div>
    );
  }

  return (
    <div className="banner warn" role="status">
      API is unreachable{error ? ` (${error})` : ""}. Showing the offline
      snapshot as a fallback. Start the API at{" "}
      <code>NEXT_PUBLIC_API_BASE</code> (default{" "}
      <code>http://127.0.0.1:8000</code>).
    </div>
  );
}
