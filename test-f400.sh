#!/bin/bash

echo "Testing F400 functionality for keyword_id 1813"
echo "=============================================="
echo ""

echo "1. Checking keyword data..."
curl -s "http://localhost:3000/api/f400-debug?keyword_id=1813" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"Keyword: {data['keyword']['keyword_datum']}\")
print(f\"Location: {data['keyword']['location_code']}\")
print(f\"Language: {data['keyword']['language_code']}\")
print(f\"Pending fetches: {data['fetches']['total_count']}\")
"
echo ""

echo "2. Attempting to create a NEW fetch (bypassing old pending ones)..."
echo "Press Enter to continue or Ctrl+C to cancel"
read

# Create a fresh F400 request
curl -X POST http://localhost:3000/api/f400 \
  -H "Content-Type: application/json" \
  -d '{"keyword_id": 1813}' \
  -s | python3 -m json.tool

echo ""
echo "Script complete. Check the results above."
echo "If successful, refresh your browser to see the pending status."