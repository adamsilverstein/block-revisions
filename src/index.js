/**
 * Load the block revisions plugin.
 */
import BlockRevisions from './block-revisions';
import uuid from 'uuid/v4';

const { addFilter } = wp.hooks;
const { registerPlugin } = wp.plugins;
const { __ } = wp.i18n;
const { Fragment }	= wp.element;
const { InspectorAdvancedControls }	= wp.blockEditor;
const { createHigherOrderComponent } = wp.compose;
const { ToggleControl } = wp.components;

import classnames from 'classnames';

const {
	PluginSidebar,
	PluginSidebarMoreMenuItem
} = wp.editPost;


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
 * Add custom attribute for uuid.
 */
function addUUIDBlockRevisionAttributes( settings ) {
	settings.attributes = Object.assign( settings.attributes, {
		uuid:{
			type: 'string',
			default: false,
		}
	});
	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'plugins/block-revisions-bt',
	addUUIDBlockRevisionAttributes
);

/**
 * Generate the uuid on a per block basis if missing.
 */
function addUUIDToBlockIfMissing( extraProps, blockType, attributes ) {

	const { uuid: u } = attributes;
	if ( ! u ) {
		attributes.uuid = uuid();
	}
	return extraProps;
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'plugins/block-revisions-wp',
	addUUIDToBlockIfMissing
);

registerPlugin( 'plugin-sidebar-expanded-test', { render: BlockRevisionsSidebar } );