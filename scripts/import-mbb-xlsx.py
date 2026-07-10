#!/usr/bin/env python3
"""Parse MBB associate Excel question bank into Vertana seed JSON."""
import json
import sys
from pathlib import Path

import openpyxl


def est_minutes(qtype, difficulty):
    d = (difficulty or "Medium").lower()
    if qtype == "coding":
        return 14 if d == "hard" else 12
    if qtype == "multiple_choice":
        if d == "easy":
            return 2
        if d == "hard":
            return 4
        return 3
    if d == "easy":
        return 5
    if d == "hard":
        return 9
    return 7


def ai_resistance(val):
    mapping = {"low": "low", "medium": "medium", "high": "high"}
    return mapping.get((val or "medium").lower(), "medium")


def parse_xlsx(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb["Question Bank"]
    headers = None
    out = []

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = row
            continue
        if not any(c is not None and str(c).strip() for c in row):
            continue

        r = dict(zip(headers, row))
        category = str(r["Category"] or "").strip()
        qtype = str(r["Type"] or "").strip().lower()
        prompt = f"[{category}] {str(r['Prompt'] or '').strip()}"

        options = []
        correct_idx = None
        if qtype == "multiple_choice":
            raw = str(r["Options (pipe-separated)"] or "")
            options = [o.strip() for o in raw.split("|") if o.strip()]
            ans = str(r["Correct Answer / Sample Answer"] or "").strip()
            matches = [j for j, o in enumerate(options) if o == ans]
            if not matches:
                matches = [
                    j for j, o in enumerate(options) if o.lower() == ans.lower()
                ]
            if not matches:
                row_id = r.get("ID", i)
                raise ValueError(
                    "Row {0}: correct answer not found in options: {1!r} options={2}".format(
                        row_id, ans, options
                    )
                )
            correct_idx = matches[0]

        points = int(r["Points"]) if r["Points"] is not None else (3 if qtype == "coding" else 1)

        out.append(
            {
                "category": "project-program-associate",
                "type": qtype,
                "prompt": prompt,
                "options": options,
                "correct_option_index": correct_idx,
                "ai_resistance": ai_resistance(r["AI Resistance"]),
                "estimated_minutes": est_minutes(qtype, r["Difficulty"]),
                "points": points,
            }
        )

    return out


def main():
    if len(sys.argv) < 2:
        print("Usage: import-mbb-xlsx.py <path-to-xlsx>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(f"File not found: {path}", file=sys.stderr)
        sys.exit(1)

    questions = parse_xlsx(path)
    print(json.dumps(questions))


if __name__ == "__main__":
    main()
