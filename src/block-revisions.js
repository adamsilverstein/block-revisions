import apiFetch from '@wordpress/api-fetch';
import dateFormat from 'dateformat';
import hash from 'object-hash';
import LineDiff from 'line-diff';
const jsdiff = require( 'diff' );

import './main.css';

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
		};

		this.handleRevisionClick = this.handleRevisionClick.bind( this );
	}

	componentDidMount() {
		wp.data.dispatch( 'core/editor' ).lockPostSaving( 'block-revisions' );

		this.getRevisions();
		this.setupBlockFilters();
		this.storePost();
	}

	componentWillUnmount() {
		this.removeBlockFilters();
		this.restorePost();
		wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'block-revisions' );
	}

	storePost() {
		this.postBlocks = wp.data.select( 'core/editor' ).getBlocks();
	}

	restorePost() {
		wp.data.dispatch( 'core/editor' ).resetBlocks( this.postBlocks );
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
				const { status } = props.attributes;
				const classToAdd = status ? ` status-${ status }` : '';
				return (
					<div className={ `block-revisions-viewer${ classToAdd }` }>
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
		const { revisions } = this.state;
		const oldContent = revisions[ i + 1 ] && revisions[ i + 1 ].content ? revisions[ i + 1 ].content.raw : '';
		const newContent = revisions[ i ] && revisions[ i ].content ? revisions[ i ].content.raw : '';
		const diff = this.getDiff( oldContent, newContent );
		wp.data.dispatch( 'core/editor' ).resetBlocks( diff );

		this.setState( {
			activeRevisionIndex: i,
		} );
	}

	/**
	 * Generate a hashmap from an array of blocks.
	 *
	 * @param {array} blocks An array of blocks.
	 *
	 * @return array An array of block hashes.
	 */
	getHashMapFromBlocks( blocks ) {
		return blocks.map( ( block ) => {
			return hash( block.attributes );
		} );
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
		).then( ( revisions ) => {
			const oldContent = revisions[1] && revisions[1].content ? revisions[1].content.raw : '';
			const newContent = revisions[ 0 ] && revisions[0].content ? revisions[0].content.raw : '';
			const diff = this.getDiff( oldContent, newContent );
			wp.data.dispatch( 'core/editor' ).resetBlocks( diff );
			this.setState( {
				revisions,
			} );
		} ).catch( ( error ) => {
				this.setState( {
					error
				} );
			} );

	}

	/**
	 * Compare two arrays of blocks, returning a diff object.
	 *
	 * @param {string} oldContent The old content.
	 * @param {string} newContent The new content.
	 *
	 * @return {LineDiff} The diff object.
	 */
	getDiff( oldContent, newContent){
		const oldBlocks = wp.blocks.parse( oldContent );
		const newBlocks = wp.blocks.parse( newContent );
		const allBlocks = [];
		oldBlocks.forEach( block => allBlocks.push( block ) );
		newBlocks.forEach( block => allBlocks.push( block ) );
		const oldParsedContent = this.getHashMapFromBlocks( oldBlocks );
		const newParsedContent = this.getHashMapFromBlocks( newBlocks );
		const lineDiff = new LineDiff( oldParsedContent, newParsedContent, 0 );
		const changes  = lineDiff.changes ? lineDiff.changes : [];
		const newLines = lineDiff.new_lines ? lineDiff.new_lines : [];
		const oldLines = lineDiff.old_lines ? lineDiff.old_lines : [];

		console.log( allBlocks, allBlocks.forEach( block => console.log( hash( block.attributes ) ) ) );

		// Build a changeMap keyed by the after hash.
		const changeMap  = [];
		changes.forEach( ( change ) => {

			const key   = change[ '_' ][1];
			const value = change[ '_' ][0];
			if ( 0 < value.length ) {
				changeMap[ key ] = value;
			}
		} );
		/*
		console.log( 'newBlocks', newBlocks );
		console.log( 'changeMap', changeMap );
		console.log( 'oldBlocks.map', oldBlocks.map( block => hash( block.attributes ) ) );
		console.log( 'newBlocks.map', newBlocks.map( block => hash( block.attributes ) ) );
*/

		// Create the new block map by matching/marking old and new.
		const markedContent = [];
		newBlocks.forEach( ( block ) => {
			const blockHash = hash( block.attributes );


			if ( changeMap[ blockHash ] ) {
				block.attributes.status = 'new';

				const newBlock = this.findBlockByHash( blockHash, allBlocks );
				const oldBlock = this.findBlockByHash( changeMap[ blockHash ], allBlocks );

				// This block was changed, show removed/added blocks.
				if ( oldBlock ) {



					// If block blocks are text, show a diff.
					if (
						oldBlock &&
						newBlock &&'core/paragraph' === oldBlock.name &&
						'core/paragraph' === newBlock.name
					) {
						console.log( 'inner diff', oldBlock.originalContent, newBlock.originalContent );
						const diff = jsdiff.diffChars( oldBlock.originalContent, newBlock.originalContent );
						let diffContent = '';
						// Build the visual diff.
						diff.forEach( ( part ) => {
							console.log( part );
							const color = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
							diffContent += `<span class="diff-${ color }">` + part.value + '</span>';
						  });
						diffContent = `<span>${ diffContent }</span>`
						console.log( diffContent );
						block.originalContent = diffContent;
						block.attributes.content = diffContent;
						block.attributes.status = 'changed';
						markedContent.push( block );
					} else {

						oldBlock.attributes.status = 'old changed';
						block.attributes.status = 'new changed';

						// For non text blocks, push the old and new blocks.
						markedContent.push( oldBlock );
						markedContent.push( block );
					}
				};


			} else {

				if ( newLines.includes( blockHash ) ) {
					block.attributes.status = 'new';
				}

				if ( oldLines.includes( blockHash ) ) {
					block.attributes.status = 'old';
				}

				markedContent.push( block );
			}
		} );
		return markedContent;
	}

	/**
	 * Search an array of blocks for the block with the matching attribute hash.
	 *
	 * @param {string} blockHash The hash to search for.
	 * @param {array}  blocks    The array of blocks to search.
	 */
	findBlockByHash( blockHash, blocks ) {
		let found = false
		blocks.forEach( ( block ) => {
			console.log( hash( block.attributes ), blockHash, hash( block.attributes ) === blockHash );
			if ( hash( block.attributes ) === blockHash ) {
				found = block;
			}
		} );
		return found;
	}

	render() {
		const {
			revisions,
			error,
			activeRevisionIndex,
			diff,
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
		return (
			<Fragment>
				{
					revisions.map( ( revision, i ) => {
						const {
							date,
							authorname,
						} = revision;
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
							</div>
						);
					} )
				}


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