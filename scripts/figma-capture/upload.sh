#!/usr/bin/env bash
# usage: upload.sh <file-list> <url-list>   (same order, one per line)
cd "$(dirname "$0")/fig"
paste -d' ' "$1" "$2" | while read -r f u; do
  r=$(curl -sS -X POST "https://mcp.figma.com/mcp/html_to_figma/$u/submit" -H "Content-Type: text/html" --data-binary @"$f")
  echo "$f $r" | tee -a ../upload-log.txt | cut -c1-160
done
