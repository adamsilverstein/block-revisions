/**
 * Load the block revisions plugin.
 */
import BlockRevisions from './block-revisions';
import uuid from 'uuid/v4';

const { addFilter } = wp.hooks;
const { registerPlugin } = wp.plugins;
const { __ } = wp.i18n;


const {
	PluginSidebar,
	PluginSidebarMoreMenuItem
} = wp.editPost;

const { Fragment } = wp.element;

const BlockRevisionsSidebar = () => (
	<Fragment>
		<PluginSidebarMoreMenuItem
			target="sidebar-name"
			icon="backup"
		>
			{ __( 'Version History', 'block-revisions' ) }
		</PluginSidebarMoreMenuItem>
		<PluginSidebar
			name="sidebar-name"
			icon="backup"
			title={ __( 'Version History', 'block-revisions' ) } >
			<BlockRevisions />
		</PluginSidebar>
	</Fragment>
)
console.log( 'registering plugin', uuid() );

/**
 * Add custom attribute for mobile visibility.
 *
 * @param {Object} settings Settings for the block.
 *
 * @return {Object} settings Modified settings.
 */
function addAttributes( settings ) {
	if( typeof settings.attributes !== 'undefined' ){

		settings.attributes = Object.assign( settings.attributes, {
			uuid:{
				type: 'string',
				default: uuid(),
			}
		});

	}
	console.log( 'addAttributes', settings );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'editorskit/custom-attributes',
	addAttributes
);

//registerPlugin( 'plugin-sidebar-expanded-test', { render: BlockRevisionsSidebar } );