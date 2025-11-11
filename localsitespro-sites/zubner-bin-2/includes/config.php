<?php
/**
 * Site Configuration File
 * Contains all site-wide settings, business information, and data arrays
 */

// Read the root path from zubby file
$zubby_file = dirname(__DIR__) . '/zubby-relative-root-path-for-links';
$site_root = '/'; // Default to root if file doesn't exist

if (file_exists($zubby_file)) {
    $site_root = trim(file_get_contents($zubby_file));
    // Ensure it ends with a slash
    if (substr($site_root, -1) !== '/') {
        $site_root .= '/';
    }
}

// Define the site root as a constant for easy access
define('SITE_ROOT', $site_root);

$site_config = [
    // Site Root Path
    'site_root' => $site_root,
    // Business Information
    'business_name' => 'Kalamazoo Roofing Contractors',
    'phone_display' => '5556667777',
    'phone_clean' => '5556667777',
    'address' => '535 S Burdick St, Kalamazoo, MI 49007',
    'city' => 'Kalamazoo',
    'state' => 'MI',
    'zip' => '49007',
    'opening_hours' => 'Mo-Fr 08:00-18:00, Sa 09:00-17:00',
    
    // Services Array
    'services' => [
        [
            'name' => 'Roof Installation',
            'slug' => 'roof-installation',
            'description' => 'Complete new roof installations with lifetime warranty'
        ],
        [
            'name' => 'Roof Repair',
            'slug' => 'roof-repair',
            'description' => 'Expert repair services for all roofing types'
        ],
        [
            'name' => 'Emergency Roof Services',
            'slug' => 'emergency-roof-services',
            'description' => '24/7 emergency response for urgent roof repairs'
        ],
        [
            'name' => 'Roof Inspection',
            'slug' => 'roof-inspection',
            'description' => 'Comprehensive roof inspections and assessments'
        ]
    ],
    
    // Service Areas Array
    'areas' => [
        ['name' => 'Portage', 'slug' => 'portage-'],
        ['name' => 'Oshtemo Charter Township', 'slug' => 'oshtemo-charter-township-'],
        ['name' => 'Texas Charter Township', 'slug' => 'texas-charter-township-'],
        ['name' => 'Parchment', 'slug' => 'parchment-'],
        ['name' => 'Richland', 'slug' => 'richland-'],
        ['name' => 'Augusta', 'slug' => 'augusta-'],
        ['name' => 'Galesburg', 'slug' => 'galesburg-'],
        ['name' => 'Climax', 'slug' => 'climax-']
    ],
    
    // Schema.org Areas Served Format
    'areas_served' => [
        [
            '@type' => 'City',
            'name' => 'Portage',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Oshtemo Charter Township',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Texas Charter Township',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Parchment',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Richland',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Augusta',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Galesburg',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ],
        [
            '@type' => 'City',
            'name' => 'Climax',
            'containedInPlace' => [
                '@type' => 'City',
                'name' => 'Kalamazoo'
            ]
        ]
    ],
    
    // Services Schema for Structured Data
    'services_schema' => [
        [
            '@type' => 'Offer',
            'name' => 'Roof Installation',
            'category' => 'roofing contractor',
            'areaServed' => 'Kalamazoo',
            'availableAtOrFrom' => [
                '@type' => 'Place',
                'name' => 'Kalamazoo Roofing Contractors',
                'address' => '535 S Burdick St, Kalamazoo, MI 49007'
            ]
        ],
        [
            '@type' => 'Offer',
            'name' => 'Roof Repair',
            'category' => 'roofing contractor',
            'areaServed' => 'Kalamazoo',
            'availableAtOrFrom' => [
                '@type' => 'Place',
                'name' => 'Kalamazoo Roofing Contractors',
                'address' => '535 S Burdick St, Kalamazoo, MI 49007'
            ]
        ],
        [
            '@type' => 'Offer',
            'name' => 'Emergency Roof Services',
            'category' => 'roofing contractor',
            'areaServed' => 'Kalamazoo',
            'availableAtOrFrom' => [
                '@type' => 'Place',
                'name' => 'Kalamazoo Roofing Contractors',
                'address' => '535 S Burdick St, Kalamazoo, MI 49007'
            ]
        ],
        [
            '@type' => 'Offer',
            'name' => 'Roof Inspection',
            'category' => 'roofing contractor',
            'areaServed' => 'Kalamazoo',
            'availableAtOrFrom' => [
                '@type' => 'Place',
                'name' => 'Kalamazoo Roofing Contractors',
                'address' => '535 S Burdick St, Kalamazoo, MI 49007'
            ]
        ]
    ],
    
    // Blog Posts Configuration (for future use)
    'recent_blog_posts' => [
        [
            'title' => '5 Warning Signs Your Kalamazoo Roof Needs Emergency Repairs Before Winter',
            'slug' => '5-signs-your-roof-needs-immediate-attention-before-its-too-late',
            'date' => '10/8/2023',
            'author' => 'Mike Johnson, Senior Roofing Expert at Kalamazoo Roofing Contractors',
            'excerpt' => 'Don\'t wait until it\'s too late! As Kalamazoo\'s trusted roofing contractors, we\'ve identified the top 5 warning signs that your roof needs immediate attention.'
        ],
        [
            'title' => 'Top Roofing Materials for Michigan Weather: Expert Rankings by Durability & Cost',
            'slug' => 'top-roofing-materials-ranked-by-durability-and-cost',
            'date' => '10/8/2023',
            'author' => 'Mike Johnson, Senior Roofing Expert at Kalamazoo Roofing Contractors',
            'excerpt' => 'Choosing the right roofing material is crucial for Michigan homeowners dealing with extreme weather conditions.'
        ],
        [
            'title' => 'The Hidden Dangers of Ignoring Minor Roof Leaks in Your Kalamazoo Home',
            'slug' => 'the-hidden-dangers-of-ignoring-minor-roof-leaks',
            'date' => '10/8/2023',
            'author' => 'Mike Johnson, Senior Roofing Expert at Kalamazoo Roofing Contractors',
            'excerpt' => 'That small water stain on your ceiling might seem harmless, but as experienced Kalamazoo roofing contractors, we\'ve seen minor leaks cause thousands in damage.'
        ]
    ]
];

// Make configuration globally accessible
$GLOBALS['site_config'] = $site_config;