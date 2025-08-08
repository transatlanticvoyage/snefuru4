<?php
/**
 * Copyright (C) 2014-2020 ServMask Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * ███████╗███████╗██████╗ ██╗   ██╗███╗   ███╗ █████╗ ███████╗██╗  ██╗
 * ██╔════╝██╔════╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔════╝██║ ██╔╝
 * ███████╗█████╗  ██████╔╝██║   ██║██╔████╔██║███████║███████╗█████╔╝
 * ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║╚██╔╝██║██╔══██║╚════██║██╔═██╗
 * ███████║███████╗██║  ██║ ╚████╔╝ ██║ ╚═╝ ██║██║  ██║███████║██║  ██╗
 * ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Kangaroos cannot jump here' );
}

class Ai1wmle_Import_Url {

	public static function execute( $params, Ai1wmle_URL_Client $url = null ) {

		// Set progress
		Ai1wm_Status::info( __( 'Connecting to URL...', AI1WMLE_PLUGIN_NAME ) );

		// Create empty archive file
		$archive = new Ai1wm_Compressor( ai1wm_archive_path( $params ) );
		$archive->close();

		// Set URL client
		if ( is_null( $url ) ) {
			$url = new Ai1wmle_URL_Client( $params['file_url'] );
		}

		$url->set_file_url( $url->get_effective_url() );

		// Rewrite URLs
		switch ( 1 ) {
			case preg_match( '/(1drv\.ms|onedrive\.live\.com)$/', $url->get_hostname() ):
				$matches = array();

				// Get OneDrive download link
				if ( ( $path = $url->get_path() ) ) {
					if ( preg_match( '/\/u\/(.+?)\//', trailingslashit( $path ), $matches ) ) {
						$url->set_file_url( sprintf( 'https://api.onedrive.com/v1.0/shares/%s/root/content', $matches[1] ) );
					}
				}

				break;

			case preg_match( '/(googledrive\.com|drive\.google\.com)$/', $url->get_hostname() ):
				$query   = array();
				$matches = array();

				// Parse the query parameters
				parse_str( $url->get_query(), $query );

				// Get Google Drive download link
				if ( isset( $query['id'] ) ) {
					$url->set_file_url( sprintf( 'https://drive.google.com/uc?export=download&id=%s', $query['id'] ) );
				} elseif ( ( $path = $url->get_path() ) ) {
					if ( preg_match( '/\/d\/(.+?)\//', trailingslashit( $path ), $matches ) ) {
						$url->set_file_url( sprintf( 'https://drive.google.com/uc?export=download&id=%s', $matches[1] ) );
					}
				}

				// Get Google Drive confirm code (file size > 40MB)
				if ( ( $file_cookies = $url->get_file_cookies( ai1wm_cookies_path( $params ) ) ) ) {
					if ( preg_match( '/download_warning_(.+?)=(.+?);/', $file_cookies, $matches ) ) {
						if ( isset( $matches[2] ) ) {
							$url->set_file_url( add_query_arg( array( 'confirm' => $matches[2] ), $url->get_file_url() ) );
						}
					}
				} else {
					$url->set_file_url( add_query_arg( array( 'confirm' => 't' ), $url->get_file_url() ) );
				}

				break;

			case preg_match( '/dropbox\.com$/', $url->get_hostname() ):
				$url->set_file_url( str_replace( 'dl=0', 'dl=1', $url->get_file_url() ) );

				break;

			case preg_match( '/(we\.tl|wetransfer\.com)$/', $url->get_hostname() ):
				$matches = array();

				// Get WeTransfer CSRF token
				$csrf_token = $url->get_wetransfer_csrf_token();

				// Get WeTransfer direct link
				if ( ( $path = $url->get_path() ) ) {
					if ( preg_match( '/\/downloads\/(.+?)\/(.+?)\/(.+?)\//', trailingslashit( $path ), $matches ) ) {
						$url->set_file_url( sprintf( 'https://wetransfer.com/api/v4/transfers/%s/download', $matches[1] ) );
						$url->set_file_url( $url->get_wetransfer_direct_link( $csrf_token, $matches[3], $matches[2] ) );
					} elseif ( preg_match( '/\/downloads\/(.+?)\/(.+?)\//', trailingslashit( $path ), $matches ) ) {
						$url->set_file_url( sprintf( 'https://wetransfer.com/api/v4/transfers/%s/download', $matches[1] ) );
						$url->set_file_url( $url->get_wetransfer_direct_link( $csrf_token, $matches[2] ) );
					}
				}

				break;

			case preg_match( '/(pcloud\.com|pcloud\.link)$/', $url->get_hostname() ):
				$query = array();

				// Parse the query parameters
				parse_str( $url->get_query(), $query );

				// Set api base url depending on data center (e - EU)
				$api_url = strpos( $url->get_hostname(), 'e' ) === 0 ? 'eapi.pcloud.com' : 'api.pcloud.com';

				// Get pCloud download link
				if ( isset( $query['code'] ) ) {
					$url->set_file_url( sprintf( 'https://%s/getpublinkdownload?code=%s', $api_url, $query['code'] ) );
					$url->set_file_url( $url->get_pcloud_direct_link() );
				}

				break;
		}

		// Set file URL
		$params['file_url'] = $url->get_file_url();

		// Set file size
		$params['file_size'] = $url->get_file_size();

		// Set file ranges
		$params['file_ranges'] = $url->get_file_ranges();

		// Set progress
		Ai1wm_Status::info( __( 'Done connecting to URL.', AI1WMLE_PLUGIN_NAME ) );

		return $params;
	}
}
