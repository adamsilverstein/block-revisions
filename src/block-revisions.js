import dateFormat from 'dateformat';
import getDiff from './get-diff';

import './main.css';
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
		};

		this.handleRevisionClick = this.handleRevisionClick.bind( this );
	}

	componentDidMount() {
		wp.data.dispatch( 'core/editor' ).lockPostSaving( 'block-revisions' );
		wp.data.dispatch( 'core/editor' ).lockPostAutosaving( 'block-revisions' );

		this.getRevisions();
		this.setupBlockFilters();
		this.storePost();
	}

	componentWillUnmount() {
		this.removeBlockFilters();
		this.restorePost();
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
		const diff = getDiff( oldContent, newContent );

		wp.data.dispatch( 'core/block-editor' ).resetBlocks( diff );

		this.setState( {
			activeRevisionIndex: i,
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
			wp.data.dispatch( 'core/block-editor' ).resetBlocks( diff );
			this.setState( {
				revisions,
			} );
		} ).catch( ( error ) => {
				this.setState( {
					error
				} );
			} );

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