    </div><!-- #content -->

    <?php if (!is_page_template('page-elementor.php')) : ?>
    <footer id="colophon" class="site-footer">
        <div class="footer-container">
            <div class="footer-main">
                <div class="footer-branding">
                    <h3 class="footer-logo">Tregnar</h3>
                    <p class="footer-description">
                        The complete SaaS platform for managing websites in bulk. Scale your web business with powerful tools designed for modern marketers.
                    </p>
                    <div class="footer-social">
                        <a href="#" aria-label="Twitter"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a>
                        <a href="#" aria-label="LinkedIn"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg></a>
                        <a href="#" aria-label="GitHub"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg></a>
                    </div>
                </div>
                
                <div class="footer-nav">
                    <div class="footer-column">
                        <h4>Product</h4>
                        <ul>
                            <li><a href="#">Features</a></li>
                            <li><a href="#">Pricing</a></li>
                            <li><a href="#">Integrations</a></li>
                            <li><a href="#">API</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h4>Use Cases</h4>
                        <ul>
                            <li><a href="#">Lead Generation</a></li>
                            <li><a href="#">Rank and Rent</a></li>
                            <li><a href="#">Affiliate Marketing</a></li>
                            <li><a href="#">Client SEO</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Case Studies</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#">About</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Contact</a></li>
                            <li><a href="#">Privacy</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <div class="footer-copyright">
                    <p>&copy; <?php echo date('Y'); ?> Tregnar. All rights reserved.</p>
                </div>
                <div class="footer-legal">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Cookie Policy</a>
                </div>
            </div>
        </div>
        
        <?php if (is_active_sidebar('footer-widgets')) : ?>
        <div class="footer-widgets">
            <div class="container">
                <?php dynamic_sidebar('footer-widgets'); ?>
            </div>
        </div>
        <?php endif; ?>
    </footer>
    <?php endif; ?>
</div><!-- #page -->

<?php wp_footer(); ?>

<style>
/* Footer Styles */
.site-footer {
    background: #111827;
    color: white;
    margin-top: auto;
}

.footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 24px 32px;
}

.footer-main {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 80px;
    margin-bottom: 60px;
}

.footer-branding {
    max-width: 400px;
}

.footer-logo {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.footer-description {
    color: #D1D5DB;
    line-height: 1.6;
    margin-bottom: 32px;
    font-size: 16px;
}

.footer-social {
    display: flex;
    gap: 16px;
}

.footer-social a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    color: #D1D5DB;
    border-radius: 8px;
    transition: all 0.3s ease;
    text-decoration: none;
}

.footer-social a:hover {
    background: #3B82F6;
    color: white;
    transform: translateY(-2px);
}

.footer-nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
}

.footer-column h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    color: white;
}

.footer-column ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.footer-column ul li {
    margin-bottom: 12px;
}

.footer-column ul li a {
    color: #D1D5DB;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;
}

.footer-column ul li a:hover {
    color: #3B82F6;
}

.footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32px;
    border-top: 1px solid #374151;
}

.footer-copyright p {
    color: #9CA3AF;
    margin: 0;
    font-size: 14px;
}

.footer-legal {
    display: flex;
    gap: 24px;
}

.footer-legal a {
    color: #9CA3AF;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;
}

.footer-legal a:hover {
    color: #3B82F6;
}

.footer-widgets {
    background: #1F2937;
    padding: 40px 0;
    border-top: 1px solid #374151;
}

.footer-widgets .widget {
    margin-bottom: 32px;
}

.footer-widgets .widget-title {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
}

.footer-widgets .widget ul {
    list-style: none;
    padding: 0;
}

.footer-widgets .widget ul li {
    margin-bottom: 8px;
}

.footer-widgets .widget a {
    color: #D1D5DB;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-widgets .widget a:hover {
    color: #3B82F6;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
    .footer-main {
        grid-template-columns: 1fr;
        gap: 60px;
    }
    
    .footer-nav {
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
    }
}

@media (max-width: 768px) {
    .footer-container {
        padding: 60px 16px 24px;
    }
    
    .footer-main {
        gap: 40px;
        margin-bottom: 40px;
    }
    
    .footer-nav {
        grid-template-columns: 1fr;
        gap: 24px;
    }
    
    .footer-bottom {
        flex-direction: column;
        gap: 20px;
        text-align: center;
    }
    
    .footer-legal {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .footer-social {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .footer-container {
        padding: 40px 16px 20px;
    }
    
    .footer-branding {
        text-align: center;
    }
    
    .footer-legal {
        flex-direction: column;
        gap: 12px;
    }
}

/* Ensure footer sticks to bottom */
html, body {
    height: 100%;
}

#page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

#content {
    flex-grow: 1;
}

/* Hide footer on Elementor pages by default */
.elementor-page .site-footer {
    display: none;
}
</style>

</body>
</html>