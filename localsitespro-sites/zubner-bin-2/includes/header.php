<?php
// Get current page information for dynamic content
$current_page = isset($page_data['current_page']) ? $page_data['current_page'] : '';
$page_title = isset($page_data['title']) ? $page_data['title'] : 'Roofing Contractor in Kalamazoo Near Me 49007';
$page_description = isset($page_data['description']) ? $page_data['description'] : 'Trusted Kalamazoo roofing contractor near me. Expert roof repairs & installations in 49007.';
$page_keywords = isset($page_data['keywords']) ? $page_data['keywords'] : 'roofing contractor, roof repair, Kalamazoo, 535 S Burdick St, Kalamazoo, MI 49007';

// Include configuration and functions
require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/functions.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($page_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($page_description); ?>">
    <meta name="keywords" content="<?php echo htmlspecialchars($page_keywords); ?>">
    <meta name="author" content="<?php echo htmlspecialchars($site_config['business_name']); ?>">
    
    <!-- Performance and SEO Meta Tags -->
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    <meta name="theme-color" content="#gray">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="<?php echo htmlspecialchars($page_title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($page_description); ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="<?php echo htmlspecialchars($site_config['business_name']); ?>">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($page_title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($page_description); ?>">
    
    <!-- Structured Data for Local Business -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "<?php echo $site_config['business_name']; ?>",
      "description": "<?php echo htmlspecialchars($page_description); ?>",
      "telephone": "<?php echo $site_config['phone_clean']; ?>",
      "priceRange": "$$",
      "openingHours": "<?php echo $site_config['opening_hours']; ?>",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "<?php echo $site_config['address']; ?>",
        "addressLocality": "<?php echo $site_config['city']; ?>",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "address": "<?php echo $site_config['address']; ?>"
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoRadius": "50000",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "address": "<?php echo $site_config['address']; ?>"
        }
      },
      "areaServed": <?php echo json_encode($site_config['areas_served']); ?>,
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Services",
        "itemListElement": <?php echo json_encode($site_config['services_schema']); ?>
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": 23
      }
    }
    </script>
    
    <!-- Tailwind CSS with optimized configuration -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#gray',
                            100: '#gray',
                            200: '#gray',
                            300: '#gray',
                            400: '#gray',
                            500: '#gray',
                            600: '#gray',
                            700: '#gray',
                            800: '#gray',
                            900: '#gray'
                        },
                        secondary: {
                            50: '#blue',
                            100: '#blue',
                            200: '#blue',
                            300: '#blue',
                            400: '#blue',
                            500: '#blue',
                            600: '#blue',
                            700: '#blue',
                            800: '#blue',
                            900: '#blue'
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Custom Blog/Prose Styles -->
    <style>
        /* Enhanced Prose Styles for Blog Content */
        .prose {
            color: #374151;
            max-width: none;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            color: #111827;
            font-weight: 700;
            line-height: 1.25;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        
        .prose h1 { font-size: 2.25rem; }
        .prose h2 { font-size: 1.875rem; }
        .prose h3 { font-size: 1.5rem; }
        .prose h4 { font-size: 1.25rem; }
        
        .prose p {
            margin-bottom: 1.25rem;
            line-height: 1.75;
        }
        
        .prose a {
            color: #gray;
            text-decoration: underline;
            font-weight: 500;
        }
        
        .prose a:hover {
            color: #gray;
        }
        
        .prose ul, .prose ol {
            margin-bottom: 1.25rem;
            padding-left: 1.625rem;
        }
        
        .prose li {
            margin-bottom: 0.5rem;
            line-height: 1.75;
        }
        
        .prose ul li {
            list-style-type: disc;
        }
        
        .prose ol li {
            list-style-type: decimal;
        }
        
        .prose strong {
            font-weight: 600;
            color: #111827;
        }
        
        .prose em {
            font-style: italic;
        }
        
        .prose blockquote {
            border-left: 4px solid #gray;
            padding-left: 1rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #6B7280;
        }
        
        .prose img {
            border-radius: 0.5rem;
            margin: 1.5rem 0;
            max-width: 100%;
            height: auto;
        }
        
        .prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
        }
        
        .prose th, .prose td {
            border: 1px solid #E5E7EB;
            padding: 0.75rem;
            text-align: left;
        }
        
        .prose th {
            background-color: #F9FAFB;
            font-weight: 600;
        }
        
        .prose code {
            background-color: #F3F4F6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        }
        
        .prose pre {
            background-color: #1F2937;
            color: #F9FAFB;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        
        .prose pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
        }
        
        /* Utility classes for blog previews */
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    </style>
    
    <!-- External Resources -->
    <link rel="stylesheet" href="<?php echo site_url('css/custom.css'); ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
    
    <!-- Performance optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="//maps.google.com">
    
    <!-- Optimized Favicon -->
    <link rel="icon" type="image/x-icon" href="<?php echo site_url('images/roofing-contractor-kalamazoo-favicon-.png'); ?>">
    <link rel="apple-touch-icon" href="<?php echo site_url('images/roofing-contractor-kalamazoo-favicon-.png'); ?>">
    
    <!-- Main JavaScript for enhanced functionality -->
    <script src="<?php echo site_url('js/main.js'); ?>" defer></script>
</head>
<body class="bg-white text-gray-900 antialiased">
    
    <header class="bg-gradient-to-r from-gray-600 to-blue-600 text-white shadow-2xl sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center">
                    <i class="fas fa-home text-2xl mr-3 opacity-80"></i>
                    <div class="text-2xl font-bold">
                        <a href="<?php echo site_url(); ?>" class="hover:text-yellow-300 transition duration-300">
                            <?php echo htmlspecialchars($site_config['business_name']); ?>
                        </a>
                    </div>
                </div>
                <nav class="hidden md:flex space-x-8 items-center">
                    <a href="<?php echo site_url(); ?>" class="hover:text-yellow-300 font-medium transition duration-300 flex items-center <?php echo $current_page === 'home' ? 'text-yellow-300' : ''; ?>">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>
                    <div class="relative group">
                        <button class="hover:text-yellow-300 font-medium transition duration-300 flex items-center <?php echo strpos($current_page, 'service') !== false ? 'text-yellow-300' : ''; ?>">
                            <i class="fas fa-tools mr-2"></i>Services <i class="fas fa-chevron-down ml-1"></i>
                        </button>
                        <div class="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                            <div class="py-2">
                                <?php foreach ($site_config['services'] as $service): ?>
                                    <a href="<?php echo site_url('services/' . $service['slug']); ?>" 
                                       class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-600 transition duration-200 flex items-center">
                                        <i class="fas fa-wrench mr-3 text-gray-500"></i><?php echo htmlspecialchars($service['name']); ?>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <div class="relative group">
                        <button class="hover:text-yellow-300 font-medium transition duration-300 flex items-center <?php echo strpos($current_page, 'area') !== false ? 'text-yellow-300' : ''; ?>">
                            <i class="fas fa-map-marker-alt mr-2"></i>Areas <i class="fas fa-chevron-down ml-1"></i>
                        </button>
                        <div class="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                            <div class="py-2">
                                <?php foreach ($site_config['areas'] as $area): ?>
                                    <a href="<?php echo site_url('areas-we-serve/' . $area['slug']); ?>" 
                                       class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-600 transition duration-200 flex items-center">
                                        <i class="fas fa-location-dot mr-3 text-red-500"></i><?php echo htmlspecialchars($area['name']); ?>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    
                    <a href="<?php echo site_url('blog/'); ?>" class="hover:text-yellow-300 font-medium transition duration-300 flex items-center <?php echo strpos($current_page, 'blog') !== false ? 'text-yellow-300' : ''; ?>">
                        <i class="fas fa-blog mr-2"></i>Blog
                    </a>
                    
                    <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-bold transition duration-300 transform hover:scale-105 shadow-lg flex items-center">
                        <i class="fas fa-phone mr-2"></i><?php echo $site_config['phone_display']; ?>
                    </a>
                </nav>
                <div class="md:hidden">
                    <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition duration-300 flex items-center">
                        <i class="fas fa-phone mr-2"></i>Call
                    </a>
                </div>
            </div>
        </div>
    </header>