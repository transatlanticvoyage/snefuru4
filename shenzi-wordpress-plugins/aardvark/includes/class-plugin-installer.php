<?php
/**
 * Plugin Installer for Aardvark Plugin Manager
 */

require_once AARDVARK_PLUGIN_PATH . 'includes/class-github-client.php';

class Aardvark_Plugin_Installer {
    
    private $github_client;
    
    public function __construct($github_token = null) {
        $this->github_client = new Aardvark_GitHub_Client($github_token);
    }
    
    /**
     * Install plugin from GitHub
     */
    public function install_from_github($github_url, $branch = 'main', $github_token = null) {
        // Parse GitHub URL
        $repo_info = Aardvark_GitHub_Client::parse_github_url($github_url);
        if (!$repo_info) {
            return array('error' => 'Invalid GitHub URL format');
        }
        
        $owner = $repo_info['owner'];
        $repo = $repo_info['repo'];
        
        // Set token if provided
        if ($github_token) {
            $this->github_client = new Aardvark_GitHub_Client($github_token);
        }
        
        // Check if repository exists and is accessible
        $repo_data = $this->github_client->get_repository($owner, $repo);
        if (isset($repo_data['error'])) {
            return array('error' => 'Cannot access repository: ' . $repo_data['error']);
        }
        
        // Download repository
        $download_result = $this->github_client->download_repository($owner, $repo, $branch);
        if (isset($download_result['error'])) {
            return array('error' => 'Download failed: ' . $download_result['error']);
        }
        
        // Extract and install
        $install_result = $this->extract_and_install($download_result['data'], $repo, $branch);
        if (isset($install_result['error'])) {
            return $install_result;
        }
        
        // Record installation in database
        $this->record_installation($repo, $install_result['plugin_path'], $github_url, $branch, $github_token);
        
        return array(
            'success' => true,
            'message' => 'Plugin installed successfully',
            'plugin_path' => $install_result['plugin_path']
        );
    }
    
    /**
     * Extract ZIP and install plugin
     */
    private function extract_and_install($zip_data, $repo_name, $branch) {
        // Get WordPress uploads directory
        $upload_dir = wp_upload_dir();
        $temp_dir = $upload_dir['basedir'] . '/aardvark-temp';
        
        // Create temp directory
        if (!wp_mkdir_p($temp_dir)) {
            return array('error' => 'Cannot create temporary directory');
        }
        
        // Write ZIP file
        $zip_file = $temp_dir . '/' . $repo_name . '-' . $branch . '.zip';
        $written = file_put_contents($zip_file, $zip_data);
        if ($written === false) {
            return array('error' => 'Cannot write ZIP file');
        }
        
        // Extract ZIP
        $extract_dir = $temp_dir . '/' . $repo_name . '-extract';
        $result = $this->extract_zip($zip_file, $extract_dir);
        if (isset($result['error'])) {
            $this->cleanup_temp_files($temp_dir);
            return $result;
        }
        
        // Find the extracted plugin directory
        $plugin_source = $this->find_plugin_directory($extract_dir, $repo_name, $branch);
        if (!$plugin_source) {
            $this->cleanup_temp_files($temp_dir);
            return array('error' => 'Cannot find plugin directory in extracted files');
        }
        
        // Move to plugins directory
        $plugins_dir = WP_PLUGIN_DIR;
        $plugin_dest = $plugins_dir . '/' . $repo_name;
        
        // Remove existing plugin if it exists
        if (is_dir($plugin_dest)) {
            $this->remove_directory($plugin_dest);
        }
        
        // Move plugin to destination
        if (!rename($plugin_source, $plugin_dest)) {
            $this->cleanup_temp_files($temp_dir);
            return array('error' => 'Cannot move plugin to plugins directory');
        }
        
        // Find main plugin file
        $main_plugin_file = $this->find_main_plugin_file($plugin_dest, $repo_name);
        if (!$main_plugin_file) {
            $this->cleanup_temp_files($temp_dir);
            return array('error' => 'Cannot find main plugin file');
        }
        
        // Cleanup
        $this->cleanup_temp_files($temp_dir);
        
        return array(
            'success' => true,
            'plugin_path' => $repo_name . '/' . basename($main_plugin_file)
        );
    }
    
    /**
     * Extract ZIP file
     */
    private function extract_zip($zip_file, $extract_to) {
        if (!class_exists('ZipArchive')) {
            return array('error' => 'ZipArchive class not available');
        }
        
        $zip = new ZipArchive();
        $result = $zip->open($zip_file);
        
        if ($result !== TRUE) {
            return array('error' => 'Cannot open ZIP file: ' . $result);
        }
        
        if (!wp_mkdir_p($extract_to)) {
            $zip->close();
            return array('error' => 'Cannot create extraction directory');
        }
        
        $extracted = $zip->extractTo($extract_to);
        $zip->close();
        
        if (!$extracted) {
            return array('error' => 'Cannot extract ZIP file');
        }
        
        return array('success' => true);
    }
    
    /**
     * Find plugin directory in extracted files
     */
    private function find_plugin_directory($extract_dir, $repo_name, $branch) {
        // GitHub typically extracts to: repo-name-branch/
        $possible_dirs = array(
            $extract_dir . '/' . $repo_name . '-' . $branch,
            $extract_dir . '/' . $repo_name . '-main',
            $extract_dir . '/' . $repo_name,
        );
        
        // Check for directories that exist and contain PHP files
        foreach ($possible_dirs as $dir) {
            if (is_dir($dir)) {
                $files = scandir($dir);
                foreach ($files as $file) {
                    if (substr($file, -4) === '.php') {
                        return $dir;
                    }
                }
            }
        }
        
        // If not found, look for any directory with PHP files
        $dirs = scandir($extract_dir);
        foreach ($dirs as $dir) {
            if ($dir === '.' || $dir === '..') continue;
            
            $full_path = $extract_dir . '/' . $dir;
            if (is_dir($full_path)) {
                $files = scandir($full_path);
                foreach ($files as $file) {
                    if (substr($file, -4) === '.php') {
                        return $full_path;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Find main plugin file
     */
    private function find_main_plugin_file($plugin_dir, $repo_name) {
        // Look for common main plugin file patterns
        $possible_files = array(
            $plugin_dir . '/' . $repo_name . '.php',
            $plugin_dir . '/index.php',
            $plugin_dir . '/main.php'
        );
        
        foreach ($possible_files as $file) {
            if (file_exists($file) && $this->is_main_plugin_file($file)) {
                return $file;
            }
        }
        
        // Scan all PHP files for plugin headers
        $files = scandir($plugin_dir);
        foreach ($files as $file) {
            if (substr($file, -4) === '.php') {
                $full_path = $plugin_dir . '/' . $file;
                if ($this->is_main_plugin_file($full_path)) {
                    return $full_path;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if file is a main plugin file by looking for plugin header
     */
    private function is_main_plugin_file($file) {
        if (!file_exists($file)) {
            return false;
        }
        
        $content = file_get_contents($file, false, null, 0, 2048);
        return strpos($content, 'Plugin Name:') !== false;
    }
    
    /**
     * Record installation in database
     */
    private function record_installation($plugin_slug, $plugin_path, $github_url, $branch, $github_token) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'zen_github_installs';
        
        $data = array(
            'plugin_slug' => $plugin_slug,
            'plugin_path' => $plugin_path,
            'github_url' => $github_url,
            'branch_name' => $branch,
            'install_status' => 'installed',
            'last_updated' => current_time('mysql'),
            'last_checked' => current_time('mysql')
        );
        
        if ($github_token) {
            $data['github_token'] = $github_token;
        }
        
        $wpdb->replace($table_name, $data);
    }
    
    /**
     * Update plugin from GitHub
     */
    public function update_plugin($plugin_slug) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'zen_github_installs';
        $plugin_data = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE plugin_slug = %s",
            $plugin_slug
        ), ARRAY_A);
        
        if (!$plugin_data) {
            return array('error' => 'Plugin not found in database');
        }
        
        // Update install status
        $wpdb->update(
            $table_name,
            array('install_status' => 'updating'),
            array('plugin_slug' => $plugin_slug)
        );
        
        // Perform installation (which will overwrite existing)
        $result = $this->install_from_github(
            $plugin_data['github_url'],
            $plugin_data['branch_name'],
            $plugin_data['github_token']
        );
        
        // Update status based on result
        $status = isset($result['error']) ? 'error' : 'installed';
        $error_message = isset($result['error']) ? $result['error'] : null;
        
        $wpdb->update(
            $table_name,
            array(
                'install_status' => $status,
                'error_message' => $error_message,
                'last_checked' => current_time('mysql')
            ),
            array('plugin_slug' => $plugin_slug)
        );
        
        return $result;
    }
    
    /**
     * Remove directory recursively
     */
    private function remove_directory($dir) {
        if (!is_dir($dir)) {
            return true;
        }
        
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->remove_directory($path);
            } else {
                unlink($path);
            }
        }
        
        return rmdir($dir);
    }
    
    /**
     * Cleanup temporary files
     */
    private function cleanup_temp_files($temp_dir) {
        if (is_dir($temp_dir)) {
            $this->remove_directory($temp_dir);
        }
    }
}