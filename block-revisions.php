<?php
/**
 * Plugin Name: Block Revisions
 * Description: Block based revisions.
 * Version:     1.0.0
 * Author:      adamsilverstein
 * Author URI:  https://github.com/adamsilverstein
 * License:     GPLv2 or later
 *
 * @package BlockRevisions
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'BLOCK_REVISIONS_VERSION', '1.0.0' );
define( 'BLOCK_REVISIONS_URL', plugin_dir_url( __FILE__ ) );
define( 'BLOCK_REVISIONS_PATH', plugin_dir_path( __FILE__ ) );
define( 'BLOCK_REVISIONS_INC', BLOCK_REVISIONS_PATH . 'includes/' );

/**
 * Composer check.
 */
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
}


// Bootstrap the plugin!
require_once BLOCK_REVISIONS_INC . 'core.php';

/**
 * Trigger a loaded action.
 */
do_action( 'block_revisions_loaded' );
