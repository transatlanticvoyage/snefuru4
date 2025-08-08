<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'local' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', 'root' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          'eG@t^)2K3qArdZd&/&z4^u)9{XHnt)G*:4^9;#8y]SN/ut|<nf!X#L#O}sq:&#g1' );
define( 'SECURE_AUTH_KEY',   '*E:rsM_i>ITNb=ZdM$&Z=/$%<R-H7;J4HD&@W|2@C:4OBgL%?#qr`K`xy_RusB+l' );
define( 'LOGGED_IN_KEY',     '!!:Z<@VXhm)u32b3Y.ADb|KQVP`c4lVM[nAndu%>tUe?i-PZP:SW*L2#}^10`d>D' );
define( 'NONCE_KEY',         'TZ6-9K=~joa1~(<IkqSUrCgXb&9k09ceFT_v?.,A}c_@S0*mc&_{&/*!SQ%oF_$S' );
define( 'AUTH_SALT',         'F Gv!kwY?N-fj9;`u+kOoUOucG8)gom~hC>n#t,KlR8t[zn{l<WHX86X&b~Q=5PW' );
define( 'SECURE_AUTH_SALT',  'K^0u/M0M@:JdOJLNc*8D{a};7Fhh9&^w`l*pm|I*bK%rgQmlEJho-HwML26$~<Lq' );
define( 'LOGGED_IN_SALT',    'X8r2bcREIT}AksVq7dLK4kF8sleQ%0F3muukOdY;PPC(aJUhW! I2<IX{zsowrKi' );
define( 'NONCE_SALT',        '2 |vP>7x^f;);.QbXsuHA={@N`R}T[Np6y;>rxmC/JM(!xqdyXfTVS)d?K;C7zA#' );
define( 'WP_CACHE_KEY_SALT', 'Gd/+p3JVIS!kJdf`1a]+*!uULUf=io-wO^4REA>6AUJ>P~NFy,$z^71EiXy)uhZy' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'WP_ENVIRONMENT_TYPE', 'local' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
