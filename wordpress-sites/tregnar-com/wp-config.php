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
define( 'AUTH_KEY',          'XLUJs#3[5LM5~Ly4ea2udMJ,ri||tm,]FXhyV!`^`#DpxO~G4$$*6#US.pL1g:6j' );
define( 'SECURE_AUTH_KEY',   'FTt>0e|XA|BL3;l2jIMV@%.2D2?^~%l:tM+@im&e|w:c,ClQn)565i~&TeQ0R)z7' );
define( 'LOGGED_IN_KEY',     '.CdHp)!e]vf,:fr?VqgHB_rn7$f`$jmTUC&S/jdd{jx._1s;bnTk9#)MzSYWm nW' );
define( 'NONCE_KEY',         'Fy{:fD^J O{_{_kTmI/-IEgAcFD2?p&rHPZ!Pe>`}c_wjqWPwIuz_B_m?[G0XRHX' );
define( 'AUTH_SALT',         't?%7p%g%xNdmvW #!7j:4F6$e>n;#=xr!i-gMV%oIXX]pAO!=VKU~ZDswk0cDy&-' );
define( 'SECURE_AUTH_SALT',  'mPkAGyv=6J<]FtN&Tvw43)VUWk)^RIxAMYQ/{-#Lk@eD3,tDv(vY.2VVg%]AaU##' );
define( 'LOGGED_IN_SALT',    '/>yUbSU^= 9,>)RpG3 md)St|ZtulM(|J^f3MbgVl[LIfitN( y%#R/|bUu~]@k5' );
define( 'NONCE_SALT',        'SI!, >^NT|H,JkB#F` !Uypp:wM$=BCL3O3,:;(Dr8sJ/KS:xFH4=P@CW.29JJCh' );
define( 'WP_CACHE_KEY_SALT', '3IiL>[K$7XFk|Ny 20u7Lu*0>?zQ#P28irR{MX}D=<*`}s]BTnNx`r)w2>-jtZBN' );


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
