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
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\admin_enqueue_scripts' );
	add_action( 'wp_head', function() {
	?>
	<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>
	<?php
	} );
}

/**
 * Fire up the plugin.
 *
 * @uses auto_tweet_loaded
 */
add_action( 'block_revisions_loaded', __NAMESPACE__ . '\setup' );

function admin_enqueue_scripts() {
	error_log( BLOCK_REVISIONS_URL . 'dist/main.js' );
	wp_enqueue_script(
		'block-revisions',
		BLOCK_REVISIONS_URL . 'dist/main.js',
		array(),
		BLOCK_REVISIONS_VERSION,
		true
	);
}
