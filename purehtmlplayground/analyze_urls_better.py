#!/usr/bin/env python3
import re
from collections import defaultdict

file_path = "/Users/kylecampbell/Documents/repos/localrepo-snefuru4/purehtmlplayground/social profiles - main guy - bulk deliveries/agg1 - created by claude code.txt"

# Main business identifiers we can see in the URLs
main_businesses = {
    'passaic roofing': ['passaicroofingcontractors', 'njroofingcontractors', 'passaicroofingnj'],
    'buckeye pest control': ['buckeyepestcontrolaz', 'buckeyepestcontrol'],
    'stamford mold removal': ['moldremovalstamfordct', 'moldremovalct'],
    'mesa water damage': ['mesaazwaterdamage'],
    'longmont plumber': ['longmontplumberco'],
    'bend porta potty': ['portapottyrentalbend'],
    'elizabeth pest control': ['pestcontrolelizabethnj', 'elizabeth-pest-control-experts'],
    'salem porta potty': ['portapottysalemor', 'portapottysalem'],
    'frederick plumber': ['frederickmdplumber'],
    'colorado springs water damage': ['springscowaterdamage'],
    'parker electrician': ['parkerelectricianco'],
    'tucson water damage': ['waterdamageintucson'],
    'carrollton pest control': ['pestcontrolcarrolltontx', 'pestcontrolcarrollton'],
    'arvada plumber': ['plumberarvadaco']
}

# Count URLs by business
business_counts = defaultdict(int)

with open(file_path, 'r') as f:
    urls = f.readlines()

# Analyze each URL
for url in urls:
    url = url.strip()
    if not url:
        continue
    
    # Check which business this URL belongs to
    for business, identifiers in main_businesses.items():
        for identifier in identifiers:
            if identifier.lower() in url.lower():
                business_counts[business] += 1
                break

# Sort by count
sorted_businesses = sorted(business_counts.items(), key=lambda x: x[1], reverse=True)

print("\n=== BREAKDOWN BY BUSINESS/END PROPERTY ===\n")
for business, count in sorted_businesses:
    print(f"{business.title()}: {count} URLs")

print(f"\nTotal URLs accounted for: {sum(business_counts.values())}")
print(f"Total URLs in file: {len([url for url in urls if url.strip()])}")

# Show some unaccounted URLs for debugging
unaccounted = []
for url in urls:
    url = url.strip()
    if url:
        found = False
        for business, identifiers in main_businesses.items():
            for identifier in identifiers:
                if identifier.lower() in url.lower():
                    found = True
                    break
            if found:
                break
        if not found:
            unaccounted.append(url)

if unaccounted:
    print(f"\nFirst 10 unaccounted URLs:")
    for url in unaccounted[:10]:
        print(f"  {url}")