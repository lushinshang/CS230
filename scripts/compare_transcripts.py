#!/usr/bin/env python3
"""Compare .en-US.srt files with their .en-US.html counterparts and write a report.

Creates `transcription/transcript_diffs.md` with per-file status and a small diff
when differences are found.
"""
import glob
import os
import re
from html import unescape
import difflib


def extract_srt_text(srt_path):
    with open(srt_path, 'r', encoding='utf-8') as f:
        text = f.read()
    blocks = re.split(r"\r?\n\r?\n", text.strip())
    lines = []
    for b in blocks:
        parts = [l.strip() for l in b.splitlines() if l.strip()]
        if len(parts) >= 3:
            # parts[2:] are text lines
            lines.append(' '.join(parts[2:]))
    return lines


def extract_html_text(html_path):
    if not os.path.exists(html_path):
        return None
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    # crude: remove tags
    text = re.sub(r'<script[\s\S]*?</script>', '', html, flags=re.I)
    text = re.sub(r'<style[\s\S]*?</style>', '', text, flags=re.I)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    text = re.sub(r'<[^>]+>', '', text)
    text = unescape(text)
    # keep lines that look like cues: split and strip
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # try to heuristically find transcript cue lines by removing header/footer
    # attempt to locate first line that looks like a timestamp or speaker; otherwise return all
    return lines


def normalize_lines(lines):
    return [re.sub(r'\s+', ' ', ln).strip() for ln in lines]


def main():
    srt_files = sorted(glob.glob('transcription/*.en-US.srt'))
    report_lines = ["# Transcript comparison report\n"]
    for srt in srt_files:
        html = srt[:-4] + '.html'  # replace .srt -> .html
        report_lines.append(f"## {os.path.basename(srt)}\n")
        srt_lines = extract_srt_text(srt)
        html_lines = extract_html_text(html)
        if html_lines is None:
            report_lines.append(f"- HTML missing: {os.path.basename(html)}\n\n")
            continue

        n_srt = normalize_lines(srt_lines)
        n_html = normalize_lines(html_lines)

        # For comparison, try to locate the transcript block in HTML by matching first few words
        # If HTML contains the SRT lines anywhere, we call it MATCH
        joined_srt = '\n'.join(n_srt)
        joined_html = '\n'.join(n_html)

        if joined_srt in joined_html:
            report_lines.append('- Status: MATCH (HTML contains SRT text)\n\n')
            continue

        # otherwise produce a small unified diff between first 200 lines
        report_lines.append('- Status: DIFFER\n')
        diff = difflib.unified_diff(n_srt, n_html, fromfile=os.path.basename(srt), tofile=os.path.basename(html), lineterm='')
        report_lines.append('```diff\n')
        for i, line in enumerate(diff):
            report_lines.append(line + '\n')
            if i > 400:
                report_lines.append('... (truncated)\n')
                break
        report_lines.append('```\n\n')

    out_path = 'transcription/transcript_diffs.md'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.writelines(report_lines)
    print('Wrote', out_path)


if __name__ == '__main__':
    main()
