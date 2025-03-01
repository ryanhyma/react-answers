import { tool } from "@langchain/core/tools";
import axios from 'axios';
import { Agent } from 'https';
import ServerLoggingService from '../../services/ServerLoggingService.js';

const checkUrlStatus = async (url, chatId = 'system') => {
    const httpsAgent = new Agent({ rejectUnauthorized: false });

    try {
        const response = await axios.get(url, { 
            httpsAgent, 
            maxRedirects: 10,
            timeout: 10000,
        });
        const isLive = response.status === 200;
        const message = isLive ? `URL is live (${url})` : `URL is dead (${url})`;
        
        ServerLoggingService.info(message, chatId, { 
            url,
            status: response.status 
        });
        
        return message;
    } catch (getError) {
        const errorMessage = `Error checking URL with GET request: ${url}. Details: ${getError.message}`;
        ServerLoggingService.error(errorMessage, chatId, getError);
        return `URL is dead ${url}`;
    }
};

const checkUrlStatusTool = tool(
    async ({ url, chatId = 'system' }) => {
        return await checkUrlStatus(url, chatId);
    },
    {
        name: "checkUrl",
        description: "Always use this tool to verify the status of a URL. Provide a valid URL.",
        schema: {
            type: "object",
            properties: {
                url: { 
                    type: "string", 
                    description: "The URL to check" 
                }
            },
            required: ["url"]
        }
    }
);

export default checkUrlStatusTool;