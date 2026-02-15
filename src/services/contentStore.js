'use strict';

const fs = require('fs').promises;
const path = require('path');

const CONTENT_PATH = path.join(__dirname, '..', 'data', 'content.json');

/**
 * Read the content.json file
 * @returns {Promise<Object>} The parsed content object
 */
async function readContent() {
    try {
        const data = await fs.readFile(CONTENT_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return default empty structure
            return {
                brand: {
                    slogan: 'Real Solutions. Multifaceted Expertise.'
                },
                categories: {}
            };
        }
        throw error;
    }
}

/**
 * Write content to the content.json file
 * @param {Object} content - The content object to write
 * @returns {Promise<void>}
 */
async function writeContent(content) {
    await fs.writeFile(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf8');
}

module.exports = {
    readContent,
    writeContent
};
