<?php
/**
 * GitHub API Client for Aardvark Plugin Manager
 */

class Aardvark_GitHub_Client {
    
    private $api_base = 'https://api.github.com';
    private $token;
    
    public function __construct($token = null) {
        $this->token = $token;
    }
    
    /**
     * Make API request to GitHub
     */
    private function make_request($endpoint, $method = 'GET', $data = null) {
        $url = $this->api_base . $endpoint;
        
        $args = array(
            'method' => $method,
            'timeout' => 30,
            'headers' => array(
                'User-Agent' => 'Aardvark-Plugin-Manager/1.0',
                'Accept' => 'application/vnd.github.v3+json'
            )
        );
        
        if ($this->token) {
            $args['headers']['Authorization'] = 'token ' . $this->token;
        }
        
        if ($data && $method !== 'GET') {
            $args['body'] = json_encode($data);
            $args['headers']['Content-Type'] = 'application/json';
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);
        
        if ($status_code >= 400) {
            return array('error' => isset($decoded['message']) ? $decoded['message'] : 'HTTP ' . $status_code);
        }
        
        return $decoded;
    }
    
    /**
     * Get repository information
     */
    public function get_repository($owner, $repo) {
        return $this->make_request("/repos/{$owner}/{$repo}");
    }
    
    /**
     * Get repository branches
     */
    public function get_branches($owner, $repo) {
        return $this->make_request("/repos/{$owner}/{$repo}/branches");
    }
    
    /**
     * Get latest commit for a branch
     */
    public function get_latest_commit($owner, $repo, $branch = 'main') {
        return $this->make_request("/repos/{$owner}/{$repo}/commits/{$branch}");
    }
    
    /**
     * Download repository as ZIP
     */
    public function download_repository($owner, $repo, $branch = 'main') {
        $url = "https://github.com/{$owner}/{$repo}/archive/refs/heads/{$branch}.zip";
        
        $args = array(
            'timeout' => 300, // 5 minutes for large repos
            'headers' => array(
                'User-Agent' => 'Aardvark-Plugin-Manager/1.0'
            )
        );
        
        if ($this->token) {
            $args['headers']['Authorization'] = 'token ' . $this->token;
        }
        
        $response = wp_remote_get($url, $args);
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            return array('error' => 'Failed to download repository: HTTP ' . $status_code);
        }
        
        return array('data' => wp_remote_retrieve_body($response));
    }
    
    /**
     * Parse GitHub URL to extract owner and repo
     */
    public static function parse_github_url($url) {
        // Handle various GitHub URL formats
        $patterns = array(
            '/github\.com\/([^\/]+)\/([^\/]+?)(\.git)?$/i',
            '/github\.com\/([^\/]+)\/([^\/]+?)\/$/i'
        );
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return array(
                    'owner' => $matches[1],
                    'repo' => $matches[2]
                );
            }
        }
        
        return false;
    }
}