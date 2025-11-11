<?php
// Page-specific configuration
$page_data = [
    'current_page' => 'home',
    'title' => 'Roofing Contractor in Kalamazoo Near Me 49007 - Roof Repairs, Emergency Services, New Installations',
    'description' => 'Trusted Kalamazoo roofing contractor near me. Expert roof repairs & installations in 49007. Available 24/7 for emergencies. Call (555) 666-7777 for same-day service.',
    'keywords' => 'roofing contractor, roof repair, Kalamazoo, 535 S Burdick St, Kalamazoo, MI 49007'
];

// Include the header
require_once 'includes/header.php';
?>

    <!-- Hero Section -->
    <section class="relative bg-gradient-to-r from-gray-600 to-blue-600 text-white">
        <div class="absolute inset-0">
            <img src="<?php echo site_url('images/roofing-contractor-kalamazoo-banner-.jpg'); ?>" 
                 alt="Professional roofing contractor services in Kalamazoo - <?php echo htmlspecialchars($site_config['business_name']); ?>"
                 class="w-full h-full object-cover opacity-30"
                 loading="eager">
        </div>
        <div class="absolute inset-0 bg-black opacity-50"></div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div class="text-center">
                <h1 class="text-4xl md:text-6xl font-bold mb-6">
                    Kalamazoo's Most Trusted Roofing Contractor - Serving Since 1995
                </h1>
                <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                    Professional Roof Repairs & Installations Throughout Greater Kalamazoo Area. Emergency Services Available 24/7. Free Estimates Within 24 Hours.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="phone-button bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg text-lg transition duration-300">
                        📞 Don't Wait Until It's Too Late! Call <?php echo format_phone($site_config['phone_display']); ?> Now for a Free Inspection
                    </a>
                    <button class="bg-transparent border-2 border-white hover:bg-white hover:text-gray-600 font-bold py-4 px-8 rounded-lg text-lg transition duration-300">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="bg-gradient-to-r from-gray-50 to-gray-100 py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div class="flex items-center mb-8">
                        <i class="fas fa-info-circle text-4xl text-gray-600 mr-4"></i>
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">About <?php echo htmlspecialchars($site_config['business_name']); ?></h2>
                    </div>
                    <div class="text-lg text-gray-600 leading-relaxed content-section">
                        <p>Welcome to <?php echo htmlspecialchars($site_config['business_name']); ?>, your premier roofing solution provider serving Kalamazoo and surrounding communities since 1995. Located at <?php echo htmlspecialchars($site_config['address']); ?>, we're central to all of Greater Kalamazoo, offering rapid response times and exceptional service.</p>
                        <p>Our licensed and insured team specializes in residential and commercial roofing services, including emergency repairs, complete roof replacements, and thorough inspections. We proudly serve Portage, Oshtemo Charter Township, Texas Charter Township, and beyond, maintaining the highest standards in roofing excellence.</p>
                        <p>As a local Kalamazoo business, we understand Michigan's unique weather challenges and provide tailored solutions for every roofing need. Our commitment to quality craftsmanship and customer satisfaction has earned us an A+ rating with the Better Business Bureau.</p>
                    </div>
                </div>
                <div class="lg:text-right">
                    <img src="<?php echo site_url('images/roofing-contractor-kalamazoo-about-.png'); ?>" 
                         alt="About <?php echo htmlspecialchars($site_config['business_name']); ?> - roofing contractor experts in Kalamazoo"
                         class="w-full h-80 object-cover rounded-xl shadow-xl"
                         loading="lazy">
                </div>
            </div>
        </div>
    </section>

    <!-- Why Choose Us Section -->
    <section class="bg-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div class="lg:order-1">
                    <img src="<?php echo site_url('images/roofing-contractor-kalamazoo-whyUs-.png'); ?>" 
                         alt="Why choose <?php echo htmlspecialchars($site_config['business_name']); ?> for roofing contractor in Kalamazoo"
                         class="w-full h-80 object-cover rounded-xl shadow-xl"
                         loading="lazy">
                </div>
                <div class="lg:order-2">
                    <div class="flex items-center mb-6">
                        <i class="fas fa-star text-4xl text-yellow-500 mr-4"></i>
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">Why Choose <?php echo htmlspecialchars($site_config['business_name']); ?>?</h2>
                    </div>
                    <div class="space-y-6">
                        <div class="flex items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg shadow-sm hover:shadow-md transition duration-300">
                            <div class="w-12 h-12 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">1</div>
                            <p class="text-gray-700 font-medium">Licensed, bonded, and insured with 28+ years of local experience</p>
                        </div>
                        <div class="flex items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg shadow-sm hover:shadow-md transition duration-300">
                            <div class="w-12 h-12 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">2</div>
                            <p class="text-gray-700 font-medium">24/7 emergency roof repair services with 60-minute response time</p>
                        </div>
                        <div class="flex items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg shadow-sm hover:shadow-md transition duration-300">
                            <div class="w-12 h-12 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">3</div>
                            <p class="text-gray-700 font-medium">Lifetime workmanship warranty on all new roof installations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Customer Reviews Section -->
    <section class="bg-gradient-to-r from-gray-50 to-gray-100 py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <div class="flex items-center justify-center mb-6">
                    <i class="fas fa-users text-4xl text-gray-600 mr-4"></i>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900">What Our Customers Say</h2>
                </div>
                <p class="text-xl text-gray-600">Real reviews from satisfied customers in Kalamazoo</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php
                $reviews = [
                    ['name' => 'Mike Johnson', 'location' => 'Portage, MI', 'rating' => 5, 'text' => 'Outstanding service from start to finish. The crew completed my new roof installation in just two days. Very professional and clean work.', 'service' => 'Roof Installation', 'date' => '2025-09-15'],
                    ['name' => 'Sarah Williams', 'location' => 'Oshtemo Charter Township, MI', 'rating' => 5, 'text' => 'Had a leak during a storm and they came out within an hour. Excellent emergency service!', 'service' => 'Emergency Roof Repair', 'date' => '2025-10-01'],
                    ['name' => 'Tom Anderson', 'location' => 'Kalamazoo (49007)', 'rating' => 4, 'text' => 'Very thorough inspection and detailed report. Helped me understand exactly what repairs were needed.', 'service' => 'Roof Inspection', 'date' => '2025-08-20'],
                    ['name' => 'Linda Martinez', 'location' => 'Texas Charter Township, MI', 'rating' => 5, 'text' => 'Fixed our shingle damage quickly and at a reasonable price. Great local company!', 'service' => 'Roof Repair', 'date' => '2025-09-28']
                ];
                
                foreach ($reviews as $review): ?>
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-200">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                            <?php echo strtoupper(substr($review['name'], 0, 1)); ?>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900"><?php echo htmlspecialchars($review['name']); ?></h4>
                            <p class="text-sm text-gray-600 flex items-center">
                                <i class="fas fa-map-marker-alt mr-1 text-red-500"></i><?php echo htmlspecialchars($review['location']); ?>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center mb-3">
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <i class="fas fa-star <?php echo $i <= $review['rating'] ? 'text-yellow-400' : 'text-gray-300'; ?>"></i>
                        <?php endfor; ?>
                        <span class="ml-2 text-sm text-gray-600">(<?php echo $review['rating']; ?>/5)</span>
                    </div>
                    <p class="text-gray-700 mb-4 italic">"<?php echo htmlspecialchars($review['text']); ?>"</p>
                    <div class="flex justify-between items-center text-sm text-gray-500">
                        <span class="flex items-center">
                            <i class="fas fa-wrench mr-1 text-gray-500"></i>
                            <?php echo htmlspecialchars($review['service']); ?>
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            <?php echo htmlspecialchars($review['date']); ?>
                        </span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <div class="text-center mt-12">
                <div class="bg-white p-6 rounded-xl shadow-lg inline-block">
                    <div class="flex items-center justify-center mb-2">
                        <div class="flex text-yellow-400 text-2xl mr-3">
                            <?php for ($i = 0; $i < 5; $i++): ?>
                                <i class="fas fa-star"></i>
                            <?php endfor; ?>
                        </div>
                        <span class="text-2xl font-bold text-gray-900">4.9/5</span>
                    </div>
                    <p class="text-gray-600">Average rating from 4+ satisfied customers</p>
                    <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="mt-4 inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300">
                        <i class="fas fa-phone mr-2"></i>Join Our Happy Customers
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="bg-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
                <p class="text-xl text-gray-600">Professional roofing contractor solutions for every need</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php foreach ($site_config['services'] as $service): ?>
                <div class="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition duration-300">
                    <div class="text-3xl mb-4">🔧</div>
                    <h3 class="text-xl font-bold mb-3 text-gray-600">
                        <a href="<?php echo site_url('services/' . $service['slug']); ?>" class="hover:underline"><?php echo htmlspecialchars($service['name']); ?></a>
                    </h3>
                    <p class="text-gray-600 mb-4"><?php echo htmlspecialchars($service['description']); ?></p>
                    <a href="<?php echo site_url('services/' . $service['slug']); ?>" class="text-gray-600 font-semibold hover:underline">Learn More →</a>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Locations Section -->
    <section class="bg-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Areas We Serve</h2>
                <p class="text-xl text-gray-600">Providing roofing contractor services throughout the Kalamazoo area</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php foreach ($site_config['areas'] as $area): ?>
                <div class="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition duration-300">
                    <div class="text-3xl mb-4">📍</div>
                    <h3 class="text-xl font-bold mb-3 text-gray-600">
                        <a href="<?php echo site_url('areas-we-serve/' . $area['slug']); ?>" class="hover:underline"><?php echo htmlspecialchars($area['name']); ?></a>
                    </h3>
                    <p class="text-gray-600 mb-4">Professional roofing contractor services in <?php echo htmlspecialchars($area['name']); ?> and surrounding areas.</p>
                    <a href="<?php echo site_url('areas-we-serve/' . $area['slug']); ?>" class="text-gray-600 font-semibold hover:underline">Learn More →</a>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Google Map Section -->
    <div class="map-container bg-gray-100 rounded-lg overflow-hidden shadow-lg">
        <div class="p-4 bg-gray-50 border-b">
            <h3 class="font-semibold text-gray-800 flex items-center">
                <i class="fas fa-map-marker-alt mr-2 text-red-500"></i>
                Find <?php echo htmlspecialchars($site_config['business_name']); ?> in Kalamazoo
            </h3>
        </div>
        <div class="relative h-64">
            <iframe
                width="100%"
                height="100%"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                loading="lazy"
                src="https://maps.google.com/maps?q=Kalamazoo%2C%20USA&t=&z=13&ie=UTF8&iwloc=&output=embed"
                title="Find <?php echo htmlspecialchars($site_config['business_name']); ?> in Kalamazoo"
                class="w-full h-full">
            </iframe>
        </div>
    </div>

    <!-- Contact Form Section -->
    <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <i class="fas fa-phone text-6xl mb-6 opacity-80"></i>
            <h2 class="text-3xl md:text-4xl font-bold mb-4">Get Your Free Estimate Today</h2>
            <p class="text-xl mb-8 opacity-90">Contact us today for professional service and free estimates</p>
            <div class="space-y-4">
                <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-xl text-xl transition duration-300 transform hover:scale-105">
                    <i class="fas fa-phone mr-3"></i>Call Now
                </a>
            </div>
        </div>
    </section>

    <!-- Blog Posts Section -->
    <section class="bg-gray-50 py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <i class="fas fa-blog text-4xl text-gray-600 mb-4"></i>
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest Insights</h2>
                <p class="text-xl text-gray-600">Expert tips and advice from <?php echo htmlspecialchars($site_config['business_name']); ?></p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php foreach ($site_config['recent_blog_posts'] as $post): ?>
                <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div class="p-6">
                        <div class="flex items-center text-sm text-gray-500 mb-3">
                            <i class="fas fa-calendar-alt mr-2"></i>
                            <span><?php echo htmlspecialchars($post['date']); ?></span>
                            <span class="mx-2">•</span>
                            <span>By <?php echo htmlspecialchars($post['author']); ?></span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                            <a href="<?php echo site_url('blog/' . $post['slug']); ?>" class="hover:text-gray-600 transition-colors">
                                <?php echo htmlspecialchars($post['title']); ?>
                            </a>
                        </h3>
                        <p class="text-gray-600 mb-4 line-clamp-3"><?php echo htmlspecialchars($post['excerpt']); ?></p>
                        <a href="<?php echo site_url('blog/' . $post['slug']); ?>" class="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors">
                            Read More <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                </article>
                <?php endforeach; ?>
            </div>
            
            <div class="text-center mt-12">
                <a href="<?php echo site_url('blog/'); ?>" class="inline-flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
                    <i class="fas fa-blog mr-2"></i>View All Blog Posts
                </a>
            </div>
        </div>
    </section>

<?php
// Include the footer
require_once 'includes/footer.php';
?>