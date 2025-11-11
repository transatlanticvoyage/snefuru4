    
    <footer class="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="md:col-span-2">
                    <div class="flex items-center mb-6">
                        <i class="fas fa-home text-3xl text-gray-400 mr-4"></i>
                        <h3 class="text-2xl font-bold"><?php echo htmlspecialchars($site_config['business_name']); ?></h3>
                    </div>
                    <p class="text-gray-300 mb-4 text-lg">Professional roofing contractor services you can trust in Kalamazoo.</p>
                    <div class="space-y-3">
                        <div class="flex items-center text-gray-300">
                            <i class="fas fa-map-marker-alt text-red-400 mr-3"></i>
                            <span><?php echo htmlspecialchars($site_config['address']); ?></span>
                        </div>
                        <div class="flex items-center text-gray-300">
                            <i class="fas fa-phone text-green-400 mr-3"></i>
                            <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="hover:text-yellow-300 transition duration-300"><?php echo $site_config['phone_display']; ?></a>
                        </div>
                        <div class="flex items-center text-gray-300">
                            <i class="fas fa-city text-blue-400 mr-3"></i>
                            <span>Serving <?php echo htmlspecialchars($site_config['city']); ?> & Surrounding Areas</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-6 flex items-center">
                        <i class="fas fa-tools text-gray-400 mr-3"></i>Our Services
                    </h3>
                    <ul class="space-y-3">
                        <?php foreach ($site_config['services'] as $service): ?>
                            <li>
                                <a href="<?php echo site_url('services/' . $service['slug']); ?>" 
                                   class="text-gray-300 hover:text-yellow-300 transition duration-300 flex items-center">
                                    <i class="fas fa-chevron-right text-gray-400 mr-2 text-sm"></i>
                                    <?php echo htmlspecialchars($service['name']); ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-bold mb-6 flex items-center">
                        <i class="fas fa-map text-green-400 mr-3"></i>Service Areas
                    </h3>
                    <ul class="space-y-3">
                        <?php foreach ($site_config['areas'] as $area): ?>
                            <li>
                                <a href="<?php echo site_url('areas-we-serve/' . $area['slug']); ?>" 
                                   class="text-gray-300 hover:text-yellow-300 transition duration-300 flex items-center">
                                    <i class="fas fa-location-dot text-red-400 mr-2 text-sm"></i>
                                    <?php echo htmlspecialchars($area['name']); ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-700 mt-12 pt-8">
                
                <div class="mb-8">
                    <div class="bg-gray-800 rounded-lg p-6">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <i class="fas fa-info-circle text-yellow-400 mr-2"></i>
                            Disclaimer
                        </h4>
                        <p class="text-gray-400 text-sm leading-relaxed">
                            This site is a free service to assist homeowners in connecting with local service contractors. All contractors are independent and this site does not warrant or guarantee any work performed. It is the responsibility of the homeowner to verify that the hired contractor furnishes the necessary license and insurance required for the work being performed. All persons depicted in a photo or video are actors or models and not contractors listed on this site.
                        </p>
                    </div>
                </div>
                
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <p class="text-gray-400 mb-4 md:mb-0">&copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars($site_config['business_name']); ?>. All rights reserved.</p>
                    <div class="flex space-x-6">
                        <span class="text-gray-400 flex items-center">
                            <i class="fas fa-shield-alt text-green-400 mr-2"></i>Licensed & Insured
                        </span>
                        <span class="text-gray-400 flex items-center">
                            <i class="fas fa-clock text-blue-400 mr-2"></i>24/7 Emergency Service
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Floating Phone Button for Mobile -->
    <a href="tel:<?php echo $site_config['phone_clean']; ?>" class="floating-phone" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; width: 64px; height: 64px; background-color: gray; color: white; border-radius: 50%; display: none; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-decoration: none; animation: pulse 2s infinite;">
        <i class="fas fa-phone text-xl"></i>
    </a>

    <style>
        /* Mobile floating phone button */
        @media (max-width: 768px) {
            .floating-phone {
                display: flex !important;
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</body>
</html>