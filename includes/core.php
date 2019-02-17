<?php
/**
 * Bootstrap the plugin.
 *
 * @package BlockRevisions\Core;
 */

/**
 * The main setup action.
 */
function setup() {
	add_action( 'admin_enque_scripts', __NAMESPACE__ . '\admin_enque_scripts' );
}

/**
 * Fire up the plugin.
 *
 * @uses auto_tweet_loaded
 */
add_action( 'block_revisions_loaded', __NAMESPACE__ . '\setup' );

function admin_enque_scripts() {
	wp_enqueue_script(
		'block-revisions',
		BLOCK_REVISIONS_INC . 'dist/index.js',
		array(),
		BLOCK_REVISIONS_VERSION,
		true
	)
}