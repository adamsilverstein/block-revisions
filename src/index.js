/**
 * Load the block revisions plugin.
 */

 import BlockRevisions from './block-revisions';

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
			{ __( 'Expanded Sidebar - More item', 'block-revisions' ) }
		</PluginSidebarMoreMenuItem>
		<PluginSidebar
			name="sidebar-name"
			icon="backup"
			title={ __( 'Block Revisions', 'block-revisions' ) } >
			<BlockRevisions />
		</PluginSidebar>
	</Fragment>
)
console.log( 'registering plugin' );
registerPlugin( 'plugin-sidebar-expanded-test', { render: BlockRevisionsSidebar } );