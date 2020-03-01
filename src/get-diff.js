import LineDiff from 'line-diff';
const jsdiff = require( 'diff' );
const {
	stripTags
} = wp.sanitize;

/**
 * Compare two arrays of blocks, returning a diff object.
 *
 * @param {string} oldContent The old content.
 * @param {string} newContent The new content.
 *
 * @return {LineDiff} The diff object.
 */
const getDiff = ( oldContent, newContent ) => {

    // Populate the allBlocks, oldBlocks and newBlocks arrays.
    const oldBlocks = wp.blocks.parse( oldContent );
    const newBlocks = wp.blocks.parse( newContent );
    const allBlocks = [];
    oldBlocks.forEach( block => allBlocks.push( block ) );
    newBlocks.forEach( block => allBlocks.push( block ) );
    let allBlockUUIDes = [];
    allBlocks.forEach ( ( block ) => {
        allBlockUUIDes[ block.attributes.uuid ] = block;
    } );
    let newBlockUUIDs = [];
    newBlocks.forEach ( ( block ) => {
        newBlockUUIDs[ block.attributes.uuid ] = block;
    } );
    let oldBlockUUIDs = [];
    oldBlocks.forEach ( ( block ) => {
        oldBlockUUIDs[ block.attributes.uuid ] = block;
    } );
    const oldParsedContent = getUUIDMapFromBlocks( oldBlocks );
    const newParsedContent = getUUIDMapFromBlocks( newBlocks );
    const lineDiff         = new LineDiff( oldParsedContent, newParsedContent, 0 );
    const changes          = lineDiff.changes ? lineDiff.changes : [];
    const newLines         = lineDiff.new_lines ? lineDiff.new_lines : [];
    const oldLines         = lineDiff.old_lines ? lineDiff.old_lines : [];

    // Build a changeMap keyed by the after UUID.
    const changeMap  = [];
    changes.forEach( ( change ) => {
        const key   = change[ '_' ][1];
        const value = change[ '_' ][0];
        if ( 0 < value.length ) {
            changeMap[ key ] = value;
        }
    } );

    // Create the new block map by matching/marking old and new.
    let markedContent = [];
    newBlocks.forEach( ( block ) => {
        const blockUUID = block.attributes.uuid;


        if ( changeMap[ blockUUID ] ) {

            const newBlock = findBlockByUUID( blockUUID, newBlocks );
            const oldBlock = findBlockByUUID( changeMap[ blockUUID ], oldBlocks );
            block.attributes.status = 'new';

            // This block was changed, show removed/added blocks.
            if ( oldBlock ) {

                // Is the old block no longer present?
                if ( ! newBlockUUIDs.includes( oldBlock.attributes.uuid ) ) {

                    // Is the old and new block the same?
                    if ( oldBlock.attributes.uuid !== block.attributes.uuid ) {

                        // Show the current block as unchanged, and the previous block as deleted.
                        if ( findBlockByUUID( block.attributes.uuid, oldBlocks ) ) {
                            block.attributes.status = 'unchanged';
                        } else {
                            block.attributes.status = 'new';
                        }
                        oldBlock.attributes.status = 'old';
                        markedContent.push( oldBlock );
                        markedContent.push( block );

                    } else {
                        block.attributes.status = 'changed';
                        // If block blocks are text, show a diff.
                        if (
                            'core/paragraph' === oldBlock.name &&
                            'core/paragraph' === block.name &&
                            oldBlock.attributes.content !== block.attributes.content
                        ) {
                            const diff = jsdiff.diffChars( stripTags( oldBlock.originalContent ).trim(), stripTags( block.originalContent ).trim() );
                            let diffContent = '';
                            // Build the visual diff.
                            diff.forEach( ( part ) => {
                                const color = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
                                diffContent += `<div class="block-inner-diff diff-${ color }">` + part.value + '</div>';
                                });
                            diffContent = `<div>${ diffContent }</div>`
                            block.content = diffContent;
                            block.attributes.content = diffContent;
                        } else {

                            if (
                                oldBlock.attributes.content !== block.attributes.content ||
                                oldBlock.attributes.caption !== block.attributes.caption
                            ) {
                                // Show before and after (old block removed, new block added).
                                block.attributes.status = 'new';
                                oldBlock.attributes.status = 'old';
                                markedContent.push( oldBlock );
                            }
                        }
                        markedContent.push( block );
                    }
                } else {

                    // If block blocks are text, show a diff.
                    if (
                        oldBlock &&
                        newBlock &&
                        'core/paragraph' === oldBlock.name &&
                        'core/paragraph' === newBlock.name
                    ) {
                        const diff = jsdiff.diffChars( stripTags( oldBlock.originalContent ).trim(), stripTags( newBlock.originalContent ).trim() );
                        let diffContent = '';
                        // Build the visual diff.
                        diff.forEach( ( part ) => {
                            const color = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
                            diffContent += `<div class="block-inner-diff diff-${ color }">` + part.value + '</div>';
                            });
                        diffContent = `<div>${ diffContent }</div>`
                        block.content = diffContent;
                        block.attributes.content = diffContent;
                        block.attributes.status = 'changed';
                        markedContent.push( block );

                    } else {
                        if ( oldBlock && newBlock ) {
                            oldBlock.attributes.status = 'unchanged';
                            markedContent.push( block );

                        } else {
                            oldBlock.attributes.status = 'old changed';
                            block.attributes.status = 'new changed';
                            // For non text blocks, push the old and new blocks.
                            markedContent.push( block );
                            markedContent.push( oldBlock );


                        }

                    }
                }
            };


        } else {

            if ( newLines.includes( blockUUID ) ) {
                block.attributes.status = 'new';
            } else if ( oldLines.includes( blockUUID ) ) {
                block.attributes.status = 'old';
            } else {
                block.attributes.status = 'unchanged';
            }

            markedContent.push( block );
        }
    } );
    return markedContent;
}

/**
 * Generate a UUID map from an array of blocks.
 *
 * @param {array} blocks An array of blocks.
 *
 * @return array An array of block UUIDs.
 */
const getUUIDMapFromBlocks = ( blocks ) => {
    return blocks.map( ( block ) => {
        return block.attributes.uuid;
    } );
}

/**
 * Search an array of blocks for the block with the matching UUID.
 *
 * @param {string} blockUUID The UUID to search for.
 * @param {array}  blocks    The array of blocks to search.
 */
const findBlockByUUID = ( blockUUID, blocks ) => {
    let found = false
    blocks.forEach( ( block ) => {
        if ( block.attributes.uuid === blockUUID ) {
            found = block;
        }
    } );
    return found;
}

export default getDiff;