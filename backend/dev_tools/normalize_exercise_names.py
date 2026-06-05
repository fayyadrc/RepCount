"""
Audit and optionally fix inconsistent exercise names in gym_logs.

Usage:
  python -m backend.dev_tools.normalize_exercise_names          # audit only
  python -m backend.dev_tools.normalize_exercise_names --apply  # update DB rows
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict

from dotenv import load_dotenv

load_dotenv()

# Allow running from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.modules.analytics.muscle_mapping import normalize_exercise_name  # noqa: E402
from app.db.supabase import supabase  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize exercise names in gym_logs")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write canonical names back to Supabase (default: audit only)",
    )
    args = parser.parse_args()

    if not supabase:
        print("Supabase client not configured. Set SUPABASE_URL and SUPABASE_KEY.")
        sys.exit(1)

    response = supabase.table("gym_logs").select("id, exercise, exercise_name").execute()
    rows = response.data or []

    changes: list[tuple[str, str, str]] = []
    merge_map: dict[str, list[str]] = defaultdict(list)

    for row in rows:
        raw = (row.get("exercise") or row.get("exercise_name") or "").strip()
        if not raw:
            continue
        canonical = normalize_exercise_name(raw)
        merge_map[canonical.lower()].append(raw)
        if raw != canonical:
            changes.append((row["id"], raw, canonical))

    print(f"Scanned {len(rows)} gym_log rows")
    print(f"Found {len(changes)} rows with non-canonical exercise names")
    print()

    merged = {k: v for k, v in merge_map.items() if len(set(v)) > 1}
    if merged:
        print("Exercise groups that will merge under analytics:")
        for canonical_key, variants in sorted(merged.items()):
            unique_variants = sorted(set(variants))
            if len(unique_variants) > 1:
                print(f"  -> {unique_variants[0]!r} (+{len(unique_variants) - 1} variants)")
                for variant in unique_variants[1:]:
                    print(f"       was: {variant!r}")
        print()

    if changes:
        print("Sample renames (up to 20):")
        for row_id, raw, canonical in changes[:20]:
            print(f"  {raw!r} -> {canonical!r}  (id={row_id})")
        if len(changes) > 20:
            print(f"  ... and {len(changes) - 20} more")
        print()

    if not args.apply:
        print("Audit complete. Re-run with --apply to update the database.")
        return

    updated = 0
    for row_id, _raw, canonical in changes:
        supabase.table("gym_logs").update(
            {
                "exercise": canonical,
                "exercise_name": canonical,
            }
        ).eq("id", row_id).execute()
        updated += 1

    print(f"Updated {updated} rows with canonical exercise names.")


if __name__ == "__main__":
    main()
