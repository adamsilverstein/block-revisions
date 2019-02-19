/**
 * Load the block revisions plugin.
 */
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
			icon="smiley"
		>
			{ __( 'Expanded Sidebar - More item', 'blockk-revisions' ); }
		</PluginSidebarMoreMenuItem>
		<PluginSidebar
			name="sidebar-name"
			icon="smiley"
			title="My Sidebar" >
			{ __( 'Content of the sidebar', 'blockk-revisions' ); }
		</PluginSidebar>
	</Fragment>
)

registerPlugin( 'plugin-sidebar-expanded-test', { render: BlockRevisionsSidebar } );