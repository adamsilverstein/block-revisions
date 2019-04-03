import apiFetch from '@wordpress/api-fetch';
import dateFormat from 'dateformat';
import './main.css';

const {
	Component,
	Fragment,
} = wp.element;


class BlockRevisions extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			revisions: false, // false until loaded.
			error: false,
			activeRevisionIndex: 0,
		};

		this.handleRevisionClick = this.handleRevisionClick.bind( this );
	}

	componentDidMount() {
		this.getRevisions();
	}

	handleRevisionClick( i ) {
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

		// @todo _embed doesn't resolve the author name, lets add that manually in a rest filter to avoid an additional request.
		const fetchPath = `/wp/v2/posts/${ postID }/revisions?context=edit&_embed`;
		console.log( 'getRevisions', fetchPath );
		return apiFetch(
			{
				path: fetchPath,
			}
		).then( ( revisions ) => {
			this.setState( {
				revisions
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
		} = this.state;

		if ( error ) {
			return 'Error!';
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

export default BlockRevisions;