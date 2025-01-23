import axios from "axios";
import { tool } from "@langchain/core/tools";

/**
 * Extracts search results from the Coveo Search API response.
 * @param {object} results - The Coveo search results object.
 * @param {number} numResults - The number of top results to extract.
 * @returns {string} - The formatted top search results with summary, link, and link text.
 */
function extractSearchResults(results, numResults = 3) {
    let extractedResults = "";

    if (results && results.results) {
        results.results.slice(0, numResults).forEach((result) => {
            const link = result.clickUri;
            const linkText = result.title || "No title available";
            const summary = result.excerpt || "No summary available";

            extractedResults += `Summary: ${summary}\nLink: ${link}\nLink Text: ${linkText}\n\n`;
        });
    }

    return extractedResults || "No results found.";
}

/**
 * @param {string} query - The search query.
 * @returns {object|null} - The Coveo search results.
 */
async function contextSearch(query) {
    try {
        console.log(`Starting search with query: ${query} at endpoint: ${process.env.CANADA_CA_SEARCH_URI}`);
        const response = await fetch(process.env.CANADA_CA_SEARCH_URI, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CANADA_CA_SEARCH_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ q: query })
        });

        if (!response.ok) {
            // Try to log the full error response
            const errorBody = await response.text();
            console.error("HTTP Error Response:", {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            throw new Error(`HTTP error! Status: ${response.status}, StatusText: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        // Log the entire error object
        console.error("Error performing search:", {
            message: error.message,
            stack: error.stack,
            response: error.response || null // Log response if available
        });
        return null;
    }
}

/**
 * canadaCASearch tool to perform a search using Coveo.
 */
const contextSearchTool = tool(
    async ({ lang, query }) => {
        try {
            console.log(`Starting search with query: ${query}`);

            const results = await contextSearch(
                query
            );

            if (!results) {
                return `Failed to retrieve search results for query: ${query}`;
            }

            const extractedResults = extractSearchResults(results);
            console.log(`Results returned for query: ${query}`);
            return extractedResults || `No meaningful results extracted for query: ${query}`;
        } catch (error) {
            console.error(`Error processing search query: ${query}. Details: ${error.message}`);
            return `An error occurred while processing the search query: ${query}`;
        }
    },
    {
        name: "canadaCASearch",
        description: "Perform a search using Coveo. Provide the 'query' as the search term. Example input: { query: 'health services' }",
        schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search term to query on the Indigenous Services Canada website.",
                },
            },
            required: ["lang", "query"],
        },
    }
);

export { contextSearchTool, contextSearch };
