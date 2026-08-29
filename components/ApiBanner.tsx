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
  return (
    <div className="banner warn" role="status">
      API is unreachable{error ? ` (${error})` : ""}. Showing a tiny offline
      fixture of real sourced rooms so the UI still renders. Start the API at{" "}
      <code>NEXT_PUBLIC_API_BASE</code> (default{" "}
      <code>http://127.0.0.1:8000</code>).
    </div>
  );
}
