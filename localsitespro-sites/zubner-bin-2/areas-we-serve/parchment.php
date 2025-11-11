<?php
// Page-specific configuration
$page_data = [
    'current_page' => 'area',
    'title' => 'Roofing Contractor in Parchment Near Me - Roof Repairs, Shingle Installation, Storm Damage',
    'description' => 'Expert roofing contractors serving Parchment & surrounding areas. Local roof repairs, replacements & emergency services. Call 5556667777 for same-day estimates!',
    'keywords' => 'roofing contractor, roof repair, Kalamazoo, 535 S Burdick St, Kalamazoo, MI 49007'
];

// Include the header
require_once dirname(__DIR__) . '/includes/header.php';
?>

<!-- Location Hero -->
        <section class="bg-gradient-to-r from-gray-50 to-blue-50 py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <i class="fas fa-map-marker-alt text-6xl text-red-600 mb-6"></i>
                    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Professional Roofing Contractors in Parchment, MI
                    </h1>
                    <p class="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
                        Serving Parchment with professional roofing contractor services
                    </p>
                    <a href="tel:5556667777" class="phone-button bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-xl text-xl transition duration-300 transform hover:scale-105 shadow-xl inline-flex items-center">
                        <i class="fas fa-phone mr-3"></i>Call 5556667777 Now
                    </a>
                </div>
            </div>
        </section>
        
        <!-- Location Description -->
        <section class="bg-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div class="flex items-center mb-6">
                            <i class="fas fa-home text-3xl text-gray-600 mr-4"></i>
                            <h2 class="text-3xl font-bold text-gray-900">Local roofing contractor Experts</h2>
                        </div>
                        <div class="text-lg text-gray-600 leading-relaxed mb-8 content-section">
                            <p>Welcome to Kalamazoo Roofing Contractors, your trusted roofing experts serving the Parchment community with over 20 years of local experience. Our team specializes in residential and commercial roofing solutions tailored to withstand Michigan's diverse weather conditions.</p><h2>Comprehensive Roofing Services in Parchment</h2><ul><li>Emergency Roof Repairs: Starting at $200</li><li>Complete Roof Replacement: From $5,000</li><li>Shingle Installation: $350-$500 per square</li><li>Roof Inspections: $150</li></ul><p>As Parchment's premier roofing contractor, we understand the unique architectural styles of local homes, from historic properties near River Reach to modern developments around Parchment Middle School. Our experienced team delivers customized roofing solutions that enhance your home's protection and curb appeal while maintaining the characteristic charm of Parchment neighborhoods.</p>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <i class="fas fa-list text-gray-600 mr-3"></i>Our Services in Parchment:
                            </h3>
                            <ul class="space-y-3">
                                
                                    <li class="flex items-center">
                                        <div class="w-4 h-4 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                            <i class="fas fa-check" style="font-size: 8px;"></i>
                                        </div>
                                        <a href="<?php echo site_url(\'services/roof-installation\'); ?>" class="text-gray-600 hover:underline font-medium">Roof Installation</a>
                                    </li>
                                
                                    <li class="flex items-center">
                                        <div class="w-4 h-4 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                            <i class="fas fa-check" style="font-size: 8px;"></i>
                                        </div>
                                        <a href="<?php echo site_url(\'services/roof-repair\'); ?>" class="text-gray-600 hover:underline font-medium">Roof Repair</a>
                                    </li>
                                
                                    <li class="flex items-center">
                                        <div class="w-4 h-4 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                            <i class="fas fa-check" style="font-size: 8px;"></i>
                                        </div>
                                        <a href="<?php echo site_url(\'services/emergency-roof-services\'); ?>" class="text-gray-600 hover:underline font-medium">Emergency Roof Services</a>
                                    </li>
                                
                                    <li class="flex items-center">
                                        <div class="w-4 h-4 bg-gradient-to-r from-gray-600 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                            <i class="fas fa-check" style="font-size: 8px;"></i>
                                        </div>
                                        <a href="<?php echo site_url(\'services/roof-inspection\'); ?>" class="text-gray-600 hover:underline font-medium">Roof Inspection</a>
                                    </li>
                                
                            </ul>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-gray-600 to-blue-600 text-white p-8 rounded-xl shadow-xl">
                        <i class="fas fa-location-dot text-4xl mb-4"></i>
                        <h3 class="text-2xl font-bold mb-4">Serving Parchment</h3>
                        <p class="mb-6 opacity-90">Call us today for fast, reliable service in your area!</p>
                        <a href="tel:5556667777" class="phone-button bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition duration-300 block text-center transform hover:scale-105 shadow-lg">
                            <i class="fas fa-phone mr-2"></i>Call 5556667777
                        </a>
                        <p class="mt-4 text-center text-sm opacity-75">Free Estimates • Licensed & Insured</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Local Information -->
        <section class="bg-gradient-to-r from-gray-50 to-gray-100 py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <div class="flex items-center justify-center mb-6">
                        <i class="fas fa-info-circle text-4xl text-gray-600 mr-4"></i>
                        <h2 class="text-3xl font-bold text-gray-900">About Parchment</h2>
                    </div>
                </div>
                <div class="max-w-4xl mx-auto">
                    <div class="bg-white p-8 rounded-xl shadow-xl">
                        <p class="text-lg text-gray-600 mb-8">Professional roofing contractor services available in Parchment. We serve this area with reliable, high-quality solutions tailored to your needs.</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <i class="fas fa-map text-gray-600 mr-3"></i>Area Information
                                </h3>
                                <div class="space-y-3">
                                    
                                    <p class="text-gray-600 flex items-center">
                                        <i class="fas fa-location-dot text-red-500 mr-3"></i><strong>Zip Code:</strong> 
                                    </p>
                                    <p class="text-gray-600 flex items-center">
                                        <i class="fas fa-map-marker-alt text-blue-500 mr-3"></i><strong>Service Area:</strong> Parchment and surrounding neighborhoods
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <i class="fas fa-road text-green-600 mr-3"></i>Nearby Areas We Serve
                                </h3>
                                <ul class="space-y-2">
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>We proudly serve Parchment and surrounding communities including Kalamazoo
                                        </li>
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>Cooper Township
                                        </li>
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>Riverview Drive area
                                        </li>
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>Northwood
                                        </li>
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>North Park
                                        </li>
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>and Riverside. Our service radius extends throughout Kalamazoo County
                                        </li>
                                    
                                        <li class="text-gray-600 flex items-center">
                                            <i class="fas fa-chevron-right text-gray-500 mr-2 text-sm"></i>ensuring prompt response times for all roofing needs.
                                        </li>
                                    
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Google Map Section -->
        
    <div class="map-container bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      <div class="p-4 bg-gray-50 border-b">
        <h3 class="font-semibold text-gray-800 flex items-center">
          <i class="fas fa-map-marker-alt mr-2 text-red-500"></i>
          Parchment Service Area Map
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
          src="https://maps.google.com/maps?q=Parchment%2C%20Kalamazoo%2C%20%2C%20USA&t=&z=13&ie=UTF8&iwloc=&output=embed"
          title="Parchment Service Area Map"
          class="w-full h-full">
        </iframe>
      </div>
    </div>
  
        
        <!-- Contact Form Section -->
        
      <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <i class="fas fa-phone text-6xl mb-6 opacity-80"></i>
              <h2 class="text-3xl md:text-4xl font-bold mb-4">Get Service in Parchment</h2>
              <p class="text-xl mb-8 opacity-90">Contact us today for professional service and free estimates</p>
              <div class="space-y-4">
                  <a href="tel:5556667777" class="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-xl text-xl transition duration-300 transform hover:scale-105">
                      <i class="fas fa-phone mr-3"></i>Call Now
                  </a>
              </div>
          </div>
      </section>

<?php
// Include the footer
require_once dirname(__DIR__) . '/includes/footer.php';
?>