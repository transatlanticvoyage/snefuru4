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
define( 'AUTH_KEY',          'CZU q|a/+/hQ{BOmnk_>G{UD5J*(/$%(:,h,Ok]%]KGCi6nK@qD>|o>lziC!= 8!' );
define( 'SECURE_AUTH_KEY',   'objt>Eg~Goch9#*N1<AvcqxO889eI!:2((Oy/V]]--lAJ2S_`${.~C|warY5mfpK' );
define( 'LOGGED_IN_KEY',     ']g3OO|@Scf%/8SQ4np*)NyJLl~0F8NNJ>>6w@}Vo[K3>>q<B{LXJ11vu,VgNj7%`' );
define( 'NONCE_KEY',         '8dAxsOf>*D0{%s~Ug v2P&<l]N2Sl[?(3$1*vgjFbHg7V#KieFN1QdSc3D0SR*z(' );
define( 'AUTH_SALT',         'rfwtGs}NB/j@2r;.^+X9W?{^HsTpR4Rh}gh]nu^b`:`_?<xHG_v1@sG<=nkD7?V;' );
define( 'SECURE_AUTH_SALT',  'g-(E3SXlCh9,t+h>SHJTf#f!Mv/,^nz6^U |QjYZLT8KOD!a/)Wn=xk#>.C#Ez.P' );
define( 'LOGGED_IN_SALT',    '[.[+=cct-Yw>Z2cT]^P:yP)Eh*P3zd8@tEa>s|D)tFSNBqlvu!CAqdKl5#)$J`H}' );
define( 'NONCE_SALT',        ']X_4%TX&f(kEvSs2KlHyEaBnVCj8xg]lMW/jR3pW4Tn@yiDxrVRO>zCJ^q2J^L-)' );
define( 'WP_CACHE_KEY_SALT', '95l$;C1RcHOc{}0E/-)z}J>o%^rfGP^{W-/Dpm*_$@f><^#2_zt&.,S6reD9V y}' );


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
