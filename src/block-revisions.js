import apiFetch from '@wordpress/api-fetch';
import dateFormat from 'dateformat';
import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';

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
			oldContent: '',
			newContent: '',
		};

		this.handleRevisionClick = this.handleRevisionClick.bind( this );
	}

	componentDidMount() {
		this.getRevisions();
	}

	handleRevisionClick( i ) {
		const { revisions } = this.state;
		const oldContent = revisions[ i + 1 ] && revisions[ i + 1 ].content ? revisions[ i + 1 ].content.raw : '';
		const newContent = revisions[ i ] && revisions[ i ].content ? revisions[ i ].content.raw : '';

		this.setState( {
			activeRevisionIndex: i,
			oldContent,
			newContent,
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

		return apiFetch(
			{
				path: fetchPath,
			}
		).then( ( revisions ) => {
			const oldContent = revisions[1] && revisions[1].content ? revisions[1].content.raw : '';
			const newContent = revisions[ 0 ] && revisions[0].content ? revisions[0].content.raw : '';
			this.setState( {
				revisions,
				oldContent,
				newContent,
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
			oldContent,
			newContent,
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
				<div className="block-revisions-diff-viewer">
					<div className="block-revisions-diff-viewer-inner">
						<ReactDiffViewer
							oldValue={ oldContent }
							newValue={ newContent }
						/>
					</div>
				</div>

			</Fragment>
		);
	}
}

export default BlockRevisions;