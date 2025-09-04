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
define( 'AUTH_KEY',          '?pF6c`afi+z%B?X|tVhFxF_J>)jLl9bRS=Pko`1HH( rK|%|sMO#NqhI,8_4Tnv9' );
define( 'SECURE_AUTH_KEY',   '>1q$;J~h>x0UH9h[D^}hmUBMdYoBuW8+{VB:`q2RU>U`}d:@g-%<P{ah&J6*jxaz' );
define( 'LOGGED_IN_KEY',     '+-cbZ;2(j)m45OXug)}g*J}A,)XCG.])(B*!sv`gu%<$A2.9u2!N^ba9gvG,t pZ' );
define( 'NONCE_KEY',         'yd1$v)EM1Zx(j,Z0V(o<33rDwEl9~.}yGh(@tkMEK)F)m1^;dNTGl@14G$$/UXz-' );
define( 'AUTH_SALT',         'IEv|w$$M;Fpf1(/jRMon!gUr;.O])(jtX{.1K&(C]O#$&cTDwr,@g[.[HZI+zi:K' );
define( 'SECURE_AUTH_SALT',  'w$=/)tA`dMg=NJV1?:.a~<5bX/T]e9X/Ec|#*G~?SlIt:mF]xFz.&b$8]:mTvDl9' );
define( 'LOGGED_IN_SALT',    'ffZ48f!6d54+c@=99xw+ wKLb+HC|2n! 75&)]/Hko+0bE<QU42Q:b8O+5}Qf]sV' );
define( 'NONCE_SALT',        'x8&FacCj)0s HL?7(a_7lUr1pY%BD%69oDl^Zk1kmAzS[jZb]uPK;1h]okbYK&Rk' );
define( 'WP_CACHE_KEY_SALT', 'AGs.ceD|1s6|W9{Bm?Wfce6DosFTtCFqhzxU J{qBs--DkqTj]=,M^-,2~bUd2wI' );


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
// Enable WordPress debug logging
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('SCRIPT_DEBUG', true);

// Enable PHP error logging
ini_set('log_errors', 1);
ini_set('error_log', ABSPATH . 'wp-content/debug.log');
error_reporting(E_ALL);

define( 'WP_ENVIRONMENT_TYPE', 'local' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
