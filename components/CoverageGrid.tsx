import Link from "next/link";
import { SOURCED_ZERO_SET, US_JURISDICTIONS, stateName } from "@/lib/states";
import type { StateCount } from "@/lib/types";

export default function CoverageGrid({
  counts,
  highlightZeros = true,
}: {
  counts: StateCount[];
  highlightZeros?: boolean;
}) {
  const byCode = new Map(counts.map((c) => [c.state, c.rooms]));
  return (
    <div className="coverage" aria-label="State coverage">
      {US_JURISDICTIONS.map((j) => {
        const n = byCode.get(j.code) ?? 0;
        const zero = n === 0 && SOURCED_ZERO_SET.has(j.code);
        const className = zero && highlightZeros ? "tile zero" : "tile";
        const inner = (
          <>
            <span className="code">{j.code}</span>
            <span className="n">
              {n === 0 && zero ? "0 sourced" : `${n} room${n === 1 ? "" : "s"}`}
            </span>
          </>
        );
        if (n === 0) {
          return (
            <div
              key={j.code}
              className={className}
              title={`${stateName(j.code)}: sourced, no rooms yet`}
            >
              {inner}
            </div>
          );
        }
        return (
          <Link
            key={j.code}
            href={`/rooms?state=${j.code}`}
            className={className}
            title={stateName(j.code)}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
