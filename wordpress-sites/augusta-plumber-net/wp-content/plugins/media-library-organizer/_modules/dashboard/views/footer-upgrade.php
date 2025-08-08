<?php
/**
 * Outputs the Upgrade section to upgrade to a Pro product.
 *
 * @package WPZincDashboardWidget
 * @author WP Zinc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( isset( $this->base->plugin->upgrade_reasons ) && is_array( $this->base->plugin->upgrade_reasons ) && count( $this->base->plugin->upgrade_reasons ) > 0 ) {
	?>
	<hr class="wpzinc-upgrade-hr" />
	<div class="wpzinc-upgrade">
		<h3>
			<?php esc_html_e( 'Upgrade to Pro', 'media-library-organizer' ); ?>
		</h3>

		<ul>	
			<?php
			foreach ( $this->base->plugin->upgrade_reasons as $reasons ) {
				?>
				<li>
					<strong><?php echo esc_html( $reasons[0] ); ?></strong>
					<?php echo esc_html( $reasons[1] ); ?>
				</li>
				<?php
			}
			?>
			<li>
				<strong><?php esc_html_e( 'Support, Documentation and Updates', 'media-library-organizer' ); ?></strong>
				<?php esc_html_e( 'Access to one on one email support, plus detailed documentation on how to install and configure the plugin and one click update notifications, right within the WordPress Administration panel.', 'media-library-organizer' ); ?>
			</li>
		</ul>

		<a href="<?php echo esc_url( $this->base->dashboard->get_upgrade_url( 'settings_footer_upgrade' ) ); ?>" class="button button-primary button-large" target="_blank"><?php esc_html_e( 'Upgrade Now', 'media-library-organizer' ); ?></a>
		<a href="<?php echo esc_url( $this->base->dashboard->get_upgrade_url( 'settings_footer_upgrade' ) ); ?>" class="button button-large" target="_blank"><?php esc_html_e( 'See all Features', 'media-library-organizer' ); ?></a>
	</div>
	<?php
}
