import { tool } from "@langchain/core/tools";
import axios from 'axios';
import { load } from 'cheerio';
import { Agent } from 'https';
import ServerLoggingService from '../../services/ServerLoggingService.js';

/**
 * Extracts the content of the body from a cheerio object, including all text and keeping <a> tags,
 * with newline characters after block elements.
 * @param {object} $ - The cheerio object of the parsed HTML.
 * @returns {string} - The extracted body content with links and formatted text.
 */
function extractBodyContentWithLinks($) {
    const bodyContent = [];
    const blockTags = new Set(['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'hr']);
    const mainTag = $('main');

    if (mainTag.length > 0) {
        mainTag.find('*').each((_, element) => {
            const tag = $(element);
            if (element.type === 'text') {
                // Strip and add text if not empty
                const text = tag.text().trim();
                if (text) bodyContent.push(text);
            } else if (element.tagName === 'a') {
                // Keep the <a> tag as is
                bodyContent.push($.html(element).trim());
            } else if (blockTags.has(element.tagName)) {
                // Add the text of the block element and a newline
                const text = tag.text().trim();
                if (text) bodyContent.push(text + '\n');
            } else {
                // For other tags, just add their text content
                const text = tag.text().trim();
                if (text) bodyContent.push(text);
            }
        });
    }

    return bodyContent.join(' ');
}

const downloadWebPage = async (url, chatId = 'system') => {
    const httpsAgent = new Agent({ rejectUnauthorized: false });
    
    try {
        ServerLoggingService.info(`Downloading webpage: ${url}`, chatId, {
            url,
            action: 'download_start'
        });
        
        const response = await axios.get(url, {
            httpsAgent,
            maxRedirects: 10,
            timeout: 10000, // Set timeout to 10 seconds
            headers: {
                'User-Agent': process.env.USER_AGENT
            }
        });
        
        const $ = load(response.data);
        const bodyContent = extractBodyContentWithLinks($);
        
        ServerLoggingService.info(`Successfully downloaded webpage: ${url}`, chatId, {
            url,
            status: response.status,
            contentLength: bodyContent.length,
            action: 'download_complete'
        });
        
        return bodyContent;
    } catch (error) {
        ServerLoggingService.error(`Error downloading webpage: ${url}`, chatId, error);
        return `Failed to download webpage: ${url}`;
    }
};

const downloadWebPageTool = tool(
    async ({ url, chatId }) => {
        return await downloadWebPage(url, chatId);
    },
    {
        name: "downloadWebPage",
        description: "When information about a URL is needed, use this function to get the web page content. Provide a valid URL.",
        schema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "The URL to download and parse content from",
                }
            },
            required: ["url"]
        },
    }
);

export default downloadWebPageTool;