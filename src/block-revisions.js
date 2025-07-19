import dateFormat from 'dateformat';
import getDiff from './get-diff';

// import './main.css'; // Temporarily commented out due to CSS loader issues
const { apiFetch } = wp;

const {
	Component,
	Fragment,
} = wp.element;

const {
	addFilter,
	removeFilter,
} = wp.hooks;


class BlockRevisions extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			revisions: false, // false until loaded.
			error: false,
			activeRevisionIndex: 0,
			diff: {},
			viewMode: 'inline', // 'inline' or 'sidebyside'
			selectedBlockUUID: null, // for block-level focus
		};

		// Cache for diff calculations to improve performance
		this.diffCache = new Map();

		this.handleRevisionClick = this.handleRevisionClick.bind( this );
		this.handleViewModeToggle = this.handleViewModeToggle.bind( this );
		this.handleBlockFocus = this.handleBlockFocus.bind( this );
	}

	componentDidMount() {
		wp.data.dispatch( 'core/editor' ).lockPostSaving( 'block-revisions' );
		wp.data.dispatch( 'core/editor' ).lockPostAutosaving( 'block-revisions' );

		this.getRevisions();
		this.setupBlockFilters();
		this.storePost();
		this.setupKeyboardNavigation();
	}

	componentWillUnmount() {
		this.removeBlockFilters();
		this.restorePost();
		this.removeKeyboardNavigation();
		wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'block-revisions' );
		wp.data.dispatch( 'core/editor' ).unlockPostAutosaving( 'block-revisions' );
	}

	storePost() {
		this.postBlocks = wp.data.select( 'core/block-editor' ).getBlocks();
	}

	restorePost() {
		wp.data.dispatch( 'core/block-editor' ).resetBlocks( this.postBlocks );
	}


	/**
	 * Set up block filters.
	 */
	setupBlockFilters() {
		/**
		 * Filter the InspectorControls for a single block type.
		 */
		const filterBlocks =  ( BlockEdit ) => {
			return ( props ) => {
				const { status, uuid } = props.attributes;
				const classToAdd = status ? ` status-${ status }` : '';
				// Note: Block focus functionality will be available when this component instance is active
				const focusClass = ''; // Simplified for now
				
				return (
					<div 
						className={ `block-revisions-viewer${ classToAdd }${ focusClass }` }
						title={ uuid ? `Block UUID: ${ uuid.substring( 0, 8 ) }...` : '' }
					>
						<BlockEdit { ...props } />
					</div>
				);
			};
		};
		addFilter( 'editor.BlockEdit', 'block-revisions/block-filter', filterBlocks );
	}

	/**
	 * Remove block filters.
	 */
	removeBlockFilters() {
		removeFilter( 'editor.BlockEdit', 'block-revisions/block-filter' );
	}

	handleRevisionClick( i ) {
		const diff = this.getDiffCached( i );

		// Only update editor if in inline mode
		if ( this.state.viewMode === 'inline' ) {
			wp.data.dispatch( 'core/block-editor' ).resetBlocks( diff );
		}

		this.setState( {
			activeRevisionIndex: i,
			diff: diff,
		} );
	}

	handleViewModeToggle() {
		const newViewMode = this.state.viewMode === 'inline' ? 'sidebyside' : 'inline';
		this.setState( {
			viewMode: newViewMode,
		} );

		// If switching to inline mode, update the editor
		if ( newViewMode === 'inline' && this.state.diff ) {
			wp.data.dispatch( 'core/block-editor' ).resetBlocks( this.state.diff );
		} else if ( newViewMode === 'sidebyside' ) {
			// Restore original content when entering side-by-side mode
			this.restorePost();
		}
	}

	handleBlockFocus( blockUUID ) {
		this.setState( {
			selectedBlockUUID: blockUUID === this.state.selectedBlockUUID ? null : blockUUID,
		} );
	}

	/**
	 * Set up keyboard navigation
	 */
	setupKeyboardNavigation() {
		this.keyboardHandler = ( event ) => {
			// Only handle if the sidebar is active and we have revisions
			if ( ! this.state.revisions || this.state.revisions.length === 0 ) {
				return;
			}

			const { activeRevisionIndex, revisions } = this.state;
			
			switch ( event.key ) {
				case 'ArrowUp':
					if ( event.ctrlKey || event.metaKey ) {
						event.preventDefault();
						const prevIndex = Math.max( 0, activeRevisionIndex - 1 );
						if ( prevIndex !== activeRevisionIndex ) {
							this.handleRevisionClick( prevIndex );
						}
					}
					break;
				case 'ArrowDown':
					if ( event.ctrlKey || event.metaKey ) {
						event.preventDefault();
						const nextIndex = Math.min( revisions.length - 1, activeRevisionIndex + 1 );
						if ( nextIndex !== activeRevisionIndex ) {
							this.handleRevisionClick( nextIndex );
						}
					}
					break;
				case 'v':
					if ( event.ctrlKey || event.metaKey ) {
						event.preventDefault();
						this.handleViewModeToggle();
					}
					break;
			}
		};
		
		document.addEventListener( 'keydown', this.keyboardHandler );
	}

	/**
	 * Remove keyboard navigation
	 */
	removeKeyboardNavigation() {
		if ( this.keyboardHandler ) {
			document.removeEventListener( 'keydown', this.keyboardHandler );
			this.keyboardHandler = null;
		}
	}

	/**
	 * Get the revisions for the post.
	 */
	async getRevisions() {
		const { getCurrentPostId } = wp.data.select("core/editor");
		const {
			root,
			nonce,
		} = wpApiSettings;
		const postID = getCurrentPostId();
		apiFetch.use( apiFetch.createRootURLMiddleware( root ) );
		apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );

		const fetchPath = `/wp/v2/posts/${ postID }/revisions?context=edit&_embed`;

		return apiFetch(
			{
				path: fetchPath,
			}
		).then( ( returnedRevisions ) => {
			const revisions = [];
			let i = 0;
			returnedRevisions.forEach( ( revision ) => {
				if ( 0 > revision.slug.indexOf( 'autosave' ) ) {
					revisions[ i++ ] = revision;
				}
			} );
			const oldContent = revisions[1] && revisions[1].content ? revisions[1].content.raw : '';
			const newContent = revisions[ 0 ] && revisions[0].content ? revisions[0].content.raw : '';
			const diff = getDiff( oldContent, newContent );
			
			// Cache the initial diff
			this.diffCache.set( 'diff-0', diff );
			
			wp.data.dispatch( 'core/block-editor' ).resetBlocks( diff );
			this.setState( {
				revisions,
				diff: diff,
			} );
		} ).catch( ( error ) => {
				this.setState( {
					error
				} );
			} );

	}

	/**
	 * Get change count for a revision
	 */
	getChangeCount( revisionIndex ) {
		const { revisions } = this.state;
		if ( revisionIndex === revisions.length - 1 ) {
			return null; // No previous revision to compare
		}

		const cacheKey = `count-${revisionIndex}`;
		if ( this.diffCache.has( cacheKey ) ) {
			return this.diffCache.get( cacheKey );
		}

		const oldContent = revisions[ revisionIndex + 1 ] && revisions[ revisionIndex + 1 ].content ? revisions[ revisionIndex + 1 ].content.raw : '';
		const newContent = revisions[ revisionIndex ] && revisions[ revisionIndex ].content ? revisions[ revisionIndex ].content.raw : '';
		const diff = getDiff( oldContent, newContent );

		let added = 0, removed = 0, modified = 0;
		diff.forEach( block => {
			if ( block.attributes.status === 'new' ) added++;
			else if ( block.attributes.status === 'old' ) removed++;
			else if ( block.attributes.status === 'changed' ) modified++;
		} );

		const result = { added, removed, modified };
		this.diffCache.set( cacheKey, result );
		return result;
	}

	/**
	 * Get or calculate diff with caching
	 */
	getDiffCached( revisionIndex ) {
		const { revisions } = this.state;
		const cacheKey = `diff-${revisionIndex}`;
		
		if ( this.diffCache.has( cacheKey ) ) {
			return this.diffCache.get( cacheKey );
		}

		const oldContent = revisions[ revisionIndex + 1 ] && revisions[ revisionIndex + 1 ].content ? revisions[ revisionIndex + 1 ].content.raw : '';
		const newContent = revisions[ revisionIndex ] && revisions[ revisionIndex ].content ? revisions[ revisionIndex ].content.raw : '';
		const diff = getDiff( oldContent, newContent );

		this.diffCache.set( cacheKey, diff );
		return diff;
	}

	/**
	 * Render side by side comparison
	 */
	renderSideBySideComparison() {
		const { revisions, activeRevisionIndex } = this.state;
		const oldContent = revisions[ activeRevisionIndex + 1 ] && revisions[ activeRevisionIndex + 1 ].content ? revisions[ activeRevisionIndex + 1 ].content.raw : '';
		const newContent = revisions[ activeRevisionIndex ] && revisions[ activeRevisionIndex ].content ? revisions[ activeRevisionIndex ].content.raw : '';
		
		const oldBlocks = wp.blocks.parse( oldContent );
		const newBlocks = wp.blocks.parse( newContent );
		const diff = getDiff( oldContent, newContent );

		// Create a mapping of blocks for comparison
		const blockPairs = this.createBlockPairs( oldBlocks, newBlocks, diff );

		return (
			<div className="sidebyside-blocks">
				{ blockPairs.map( ( pair, index ) => (
					<div key={ index } className="block-pair">
						<div className="sidebyside-column old-block">
							{ pair.oldBlock && this.renderBlockForComparison( pair.oldBlock, 'old' ) }
						</div>
						<div className="sidebyside-column new-block">
							{ pair.newBlock && this.renderBlockForComparison( pair.newBlock, 'new' ) }
						</div>
					</div>
				) ) }
			</div>
		);
	}

	/**
	 * Create block pairs for side-by-side comparison
	 */
	createBlockPairs( oldBlocks, newBlocks, diff ) {
		// This is a simplified version - in a full implementation, 
		// you'd want more sophisticated block matching
		const maxLength = Math.max( oldBlocks.length, newBlocks.length );
		const pairs = [];

		for ( let i = 0; i < maxLength; i++ ) {
			pairs.push( {
				oldBlock: oldBlocks[ i ] || null,
				newBlock: newBlocks[ i ] || null,
			} );
		}

		return pairs;
	}

	/**
	 * Render a single block for comparison view
	 */
	renderBlockForComparison( block, side ) {
		if ( ! block ) return null;

		const blockContent = this.getBlockDisplayContent( block );
		const isSelected = block.attributes.uuid === this.state.selectedBlockUUID;

		return (
			<div
				className={ `comparison-block ${ side } ${ isSelected ? 'selected' : '' }` }
				onClick={ () => this.handleBlockFocus( block.attributes.uuid ) }
			>
				<div className="block-type">{ block.name }</div>
				<div className="block-content">{ blockContent }</div>
			</div>
		);
	}

	/**
	 * Get display content for a block
	 */
	getBlockDisplayContent( block ) {
		if ( block.name === 'core/paragraph' ) {
			return block.attributes.content || block.originalContent || '';
		}
		// Handle other block types
		return block.originalContent || JSON.stringify( block.attributes, null, 2 );
	}

	/**
	 * Restore a specific block to a previous version
	 */
	restoreBlock( blockUUID ) {
		// This is a placeholder for block-level restoration
		// In a full implementation, this would restore just the selected block
		console.log( 'Restoring block:', blockUUID );
		
		// For now, show an alert to indicate the feature
		alert( `Block restoration feature would restore block ${blockUUID.substring(0, 8)}... to the selected revision.` );
	}

	render() {
		const {
			revisions,
			error,
			activeRevisionIndex,
			diff,
			viewMode,
			selectedBlockUUID,
		} = this.state;

		if ( error ) {
			return `Error! ${ error }`;
		}

		if ( false === revisions ) {
			return (
				<p
					className="block-revisions-loading"
				>
					Loading...
				</p>
			);
		}

		const currentRevision = revisions[ activeRevisionIndex ];
		const previousRevision = revisions[ activeRevisionIndex + 1 ];

		return (
			<Fragment>
				<div className="block-revisions-controls">
					<button
						className={ `block-revisions-view-toggle ${ viewMode }` }
						onClick={ this.handleViewModeToggle }
						title={ viewMode === 'inline' ? 'Switch to side-by-side view (Ctrl+V)' : 'Switch to inline view (Ctrl+V)' }
					>
						{ viewMode === 'inline' ? '⚏' : '☰' } { viewMode === 'inline' ? 'Side-by-Side' : 'Inline' }
					</button>
					<div className="keyboard-shortcuts">
						<small>
							⌨️ Ctrl+↑/↓: Navigate revisions | Ctrl+V: Toggle view
						</small>
					</div>
				</div>

				<div className="block-revisions-list">
					{
						revisions.map( ( revision, i ) => {
							const {
								date,
								authorname,
							} = revision;
							const changeCount = this.getChangeCount( i );
							return (
								<div
									className={ `block-revisions-revision${ activeRevisionIndex === i ? ' active' : '' }` }
									key={ i }
									onClick={ () => {
										this.handleRevisionClick( i );
									} }
								>
									<p className="block-revision-date">
									{ dateFormat( date, 'mmm dS, h:MM TT' ) }
									</p>
									<p className="block-revision-author">
										{ authorname }
									</p>
									{ changeCount && (
										<p className="block-revision-changes">
											{ changeCount.added > 0 && <span className="change-count added">+{ changeCount.added }</span> }
											{ changeCount.removed > 0 && <span className="change-count removed">-{ changeCount.removed }</span> }
											{ changeCount.modified > 0 && <span className="change-count modified">~{ changeCount.modified }</span> }
										</p>
									) }
								</div>
							);
						} )
					}
				</div>

				{ viewMode === 'sidebyside' && currentRevision && (
					<div className="block-revisions-sidebyside-view">
						<div className="sidebyside-header">
							<div className="sidebyside-column">
								<h4>Previous ({ previousRevision ? dateFormat( previousRevision.date, 'mmm dS, h:MM TT' ) : 'Original' })</h4>
							</div>
							<div className="sidebyside-column">
								<h4>Current ({ dateFormat( currentRevision.date, 'mmm dS, h:MM TT' ) })</h4>
							</div>
						</div>
						<div className="sidebyside-content">
							{ this.renderSideBySideComparison() }
						</div>
					</div>
				) }

				{ selectedBlockUUID && (
					<div className="block-focus-panel">
						<h4>Block Changes</h4>
						<p>Focused on block: { selectedBlockUUID.substring( 0, 8 ) }...</p>
						<button 
							className="block-restore-button"
							onClick={ () => this.restoreBlock( selectedBlockUUID ) }
						>
							Restore This Block
						</button>
					</div>
				) }
			</Fragment>
		);
	}
}
/*<div className="block-revisions-diff-viewer">
					<div className="block-revisions-diff-viewer-inner">
						Coming sooon.
					</div>
				</div>*/
export default BlockRevisions;