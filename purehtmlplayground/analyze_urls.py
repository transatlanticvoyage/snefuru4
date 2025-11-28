#!/usr/bin/env python3
import re
from collections import defaultdict

file_path = "/Users/kylecampbell/Documents/repos/localrepo-snefuru4/purehtmlplayground/social profiles - main guy - bulk deliveries/agg1 - created by claude code.txt"

# Dictionary to store URLs by property/username
property_counts = defaultdict(list)

# Common patterns to extract usernames/properties from URLs
patterns = [
    r'pinterest\.com/([^/]+)',
    r'quora\.com/profile/([^/]+)',
    r'issuu\.com/([^/]+)',
    r'wakelet\.com/@([^/]+)',
    r'deviantart\.com/([^/]+)',
    r'gravatar\.com/([^/]+)',
    r'unsplash\.com/@([^/]+)',
    r'soundcloud\.com/([^/]+)',
    r'sketchfab\.com/([^/]+)',
    r'stocktwits\.com/([^/]+)',
    r'disqus\.com/by/([^/]+)',
    r'hashnode\.com/@([^/]+)',
    r'justpaste\.it/u/([^/]+)',
    r'myanimelist\.net/profile/([^/]+)',
    r'500px\.com/p/([^/]+)',
    r'mymeetbook\.com/([^/]+)',
    r'owntweet\.com/([^/]+)',
    r'4shared\.com/u/[^/]+/([^/]+)',
    r'uniquethis\.com/([^/]+)',
    r'hackmd\.io/@([^/]+)',
    r'audiomack\.com/([^/]+)',
    r'profile\.hatena\.ne\.jp/([^/]+)',
    r'reverbnation\.com/artist/([^/]+)',
    r'mapleprimes\.com/users/([^/]+)',
    r'qiita\.com/([^/]+)',
    r'letterboxd\.com/([^/]+)',
    r'tumblr\.com/([^/]+)',
    r'tumblr\.com/blog/([^/]+)',
    r'empowher\.com/users/([^/]+)',
    r'bandcamp\.com/([^/]+)',
    r'outdooractive\.com/en/member/([^/]+)',
    r'diigo\.com/profile/([^/]+)',
    r'diigo\.com/user/([^/]+)',
    r'designspiration\.com/([^/]+)',
    r'bestbizportal\.com/([^/]+)',
    r'kickstarter\.com/profile/([^/]+)',
    r'giphy\.com/channel/([^/]+)',
    r'apsense\.com/user/([^/]+)',
    r'scener\.com/@([^/]+)',
    r'speakerdeck\.com/([^/]+)',
    r'myminifactory\.com/users/([^/]+)',
    r'medium\.com/@([^/]+)',
    r'zumvu\.com/([^/]+)',
    r'roomstyler\.com/users/([^/]+)',
    r'producthunt\.com/@([^/]+)',
    r'behance\.net/([^/]+)',
    r'about\.me/([^/]+)',
    r'ted\.com/profiles/([^/]+)',
    r'anyflip\.com/homepage/([^/]+)',
    r'magcloud\.com/user/([^/]+)',
    r'codementor\.io/@([^/]+)',
    r'longisland\.com/profile/([^/]+)',
    r'pexels\.com/@([^/\-0-9]+)',
    r'band\.us/band/([^/]+)',
    r'dzone\.com/users/[^/]+/([^/]+)',
    r'fliphtml5\.com/homepage/([^/]+)',
    r'experiment\.com/users/([^/]+)',
    r'mixcloud\.com/([^/]+)',
    r'mystrikingly\.com',
    r'blogspot\.com',
    r'blogger\.com/profile/([^/]+)',
    r'myspace\.com/([^/]+)',
    r'twitch\.tv/([^/]+)',
    r'pearltrees\.com/([^/]+)',
    r'coolors\.co/u/([^/]+)',
    r'telegra\.ph/([^/]+)',
    r'slideserve\.com/([^/]+)',
    r'openstreetmap\.org/user/([^/]+)',
    r'archdaily\.com/us/@([^/]+)',
    r'wordpress\.com',
    r'([^/]+)\.bandcamp\.com',
    r'([^/]+)\.blogspot\.com',
    r'([^/]+)\.mystrikingly\.com',
    r'knowyourmeme\.com/users/([^/]+)',
    r'triberr\.com/([^/]+)',
    r'startupxplore\.com/en/person/([^/]+)',
    r'independent\.academia\.edu/([^/]+)',
    r'bitchute\.com/channel/([^/]+)',
    r'flipboard\.com/@([^/]+)',
]

with open(file_path, 'r') as f:
    urls = f.readlines()

# Extract property names from URLs
for url in urls:
    url = url.strip()
    if not url:
        continue
    
    # Try to identify the property/username
    property_name = None
    
    # Check common patterns
    for pattern in patterns:
        match = re.search(pattern, url.lower())
        if match:
            property_name = match.group(1) if len(match.groups()) > 0 else match.group(0)
            # Clean up the property name
            property_name = property_name.strip('/')
            break
    
    # If no pattern matched, try to extract from the URL path
    if not property_name:
        # Skip generic URLs
        if any(x in url for x in ['/profile/', '/user/', '/member/', '/post/', '/album/']):
            parts = url.split('/')
            for i, part in enumerate(parts):
                if part in ['profile', 'user', 'member', 'users', 'artist'] and i + 1 < len(parts):
                    property_name = parts[i + 1]
                    break
    
    if property_name:
        # Normalize the property name
        property_name = property_name.lower().strip()
        if property_name and not property_name.isdigit() and len(property_name) > 2:
            property_counts[property_name].append(url)

# Sort properties by count
sorted_properties = sorted(property_counts.items(), key=lambda x: len(x[1]), reverse=True)

# Display results
print("\n=== URL COUNT BY PROPERTY ===\n")
for prop, urls in sorted_properties:
    if len(urls) >= 5:  # Only show properties with at least 5 URLs
        print(f"{prop}: {len(urls)} URLs")

print(f"\n=== SUMMARY ===")
print(f"Total unique properties found: {len(property_counts)}")
print(f"Total URLs analyzed: {len([url for url in urls if url.strip()])}")