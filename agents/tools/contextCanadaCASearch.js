import { tool } from "@langchain/core/tools";
import { chromium } from "playwright";
import { load } from "cheerio";
import { URL } from "url";
import fs from "fs";

const fingerprint = JSON.parse(fs.readFileSync('./agents/tools/browser_fingerprint.json', 'utf-8'));

/**
 * Extracts search results from the ISC search results page.
 * @param {string} baseUrl - The base URL used to resolve relative links.
 * @param {object} $ - The Cheerio object of the parsed HTML.
 * @param {number} numResults - The number of top results to extract.
 * @returns {string} - The formatted top search results with summary, link, link text, and most frequent department.
 */
function extractSearchResults(baseUrl, $, numResults = 5) {
    let extractedResults = "";
    const resultsDiv = $("div.results");
    const departmentCount = {};
    let topResult = {};

    if (resultsDiv.length) {
        const sections = resultsDiv.find("section");

        sections.slice(0, numResults).each((index, section) => {
            const titleElement = $(section).find("h3 a.result-link");
            if (titleElement.length) {
                let link = titleElement.attr("href");
                const linkText = titleElement.text().trim();

                // Ensure link is absolute
                if (link && !link.startsWith("http")) {
                    link = new URL(link, baseUrl).href;
                }

                const summary = $(section).find("p").text().trim();
                const department = $(section).find("ul.context-labels li").text().trim();

                if (department) {
                    departmentCount[department] = (departmentCount[department] || 0) + 1;
                }

                if (index === 0) {
                    topResult = {
                        department,
                        link,
                        linkText,
                        summary
                    };
                }

                extractedResults += `Summary: ${summary}\nLink: ${link}\nLink Text: ${linkText}\nDepartment: ${department}\n\n`;
            }
        });
    }

    const mostFrequentDepartment = Object.keys(departmentCount).reduce((a, b) => departmentCount[a] > departmentCount[b] ? a : b, "");

    return {
        extractedResults: extractedResults || "No results found.",
        mostFrequentDepartment,
        topResult
    };
}

/**
 * Downloads and parses the search results page using Playwright and Cheerio.
 * @param {string} url - The URL to download and parse.
 * @param {string} selectorToWaitFor - The selector to wait for before extracting content.
 * @returns {object} - Cheerio object of the loaded HTML.
 */
const dynamicDownloadAndParseWebpage = async (url, selectorToWaitFor = "div.results") => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: fingerprint.userAgent,
        viewport: {
            width: parseInt(fingerprint.screenResolution.split('x')[0]),
            height: parseInt(fingerprint.screenResolution.split('x')[1]),
        },
        locale: fingerprint.language,
        timezoneId: fingerprint.timezone,
        colorScheme: fingerprint.colorDepth === 24 ? 'light' : 'dark',
        deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    // Inject JavaScript to override properties that can't be set via context options
    await page.addInitScript(fingerprint => {
        // Mock navigator properties
        Object.defineProperty(navigator, 'languages', {
            get: () => fingerprint.languages,
        });
        Object.defineProperty(navigator, 'platform', {
            get: () => fingerprint.platform,
        });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => fingerprint.hardwareConcurrency,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', {
            get: () => fingerprint.touchSupport.maxTouchPoints,
        });
        Object.defineProperty(navigator, 'cookieEnabled', {
            get: () => fingerprint.cookiesEnabled,
        });
        Object.defineProperty(navigator, 'doNotTrack', {
            get: () => fingerprint.doNotTrack,
        });

        // Mock WebGL properties
        const getWebGLInfo = () => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gl.getParameter = new Proxy(gl.getParameter, {
                    apply(target, thisArg, args) {
                        if (args[0] === debugInfo.UNMASKED_VENDOR_WEBGL) return fingerprint.webGLVendor;
                        if (args[0] === debugInfo.UNMASKED_RENDERER_WEBGL) return fingerprint.webGLRenderer;
                        return Reflect.apply(target, thisArg, args);
                    },
                });
            }
        };
        getWebGLInfo();

        // Mock canvas fingerprint
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (...args) {
            return fingerprint.canvasFingerprint;
        };
    }, fingerprint);
    try {
        console.log(`Navigating to search page...`);
        page.on('response', response => {
            console.log(`${response.status()} - ${response.url()}`);
          });
        await page.goto('https://www.canada.ca/en/sr/srb.html', { waitUntil: "domcontentloaded" });
        console.log('HTML content of the search page:', page.content());
        // Wait for search input
        await page.waitForSelector('#sch-inp-ac');
        
        // Type the search query
        await page.fill('#sch-inp-ac', new URL(url).searchParams.get('q'));
        
        // Submit the form
        await page.click('#sch-inp');
        
        // Wait for results
        await page.waitForSelector(selectorToWaitFor, { timeout: 5000, polling: 100 });
    
        // Get the HTML content after dynamic content has loaded
        const html = await page.content();
        return load(html);
    } catch (error) {
        console.error(`Could not connect to ${url} because: ${error.message}`);
        // Log the HTML content of the page in case of an error
        const htmlContent = await page.content();
        console.log('HTML content of the page at error:', htmlContent);
        return null;
    } finally {
        await browser.close();
    }
};

/**
 * canadaCASearch tool to perform a search on the Indigenous Services Canada website.
 */
const contextCanadaCASearch = tool(
    async ({ lang, query }) => {
        try {
            let iscUrl = "https://www.canada.ca/en/sr/srb.html?q=";
            if (lang === "fra") {
                iscUrl = "https://www.canada.ca/fr/sr/srb.htmlq=";
            }

            console.log(`Starting search with query: ${query}`);
            const fullUrl = iscUrl + encodeURIComponent(query);
            const $ = await dynamicDownloadAndParseWebpage(fullUrl);

            if (!$) {
                return `Failed to download or parse the search results for query: ${query}`;
            }

            const results = extractSearchResults(iscUrl, $);
            console.log(`Results returned for query: ${query}`);
            return results || `No meaningful results extracted for query: ${query}`;
        } catch (error) {
            console.error(`Error processing search query: ${query}. Details: ${error.message}`);
            return `An error occurred while processing the search query: ${query}`;
        }
    },
    {
        name: "contextCanadaCASearch",
        description: "Perform a search on the Canada.ca website. Provide 'lang' ('eng' for English or 'fra' for French) and 'query' as the search term. Example input: { lang: 'eng', query: 'health services' }",
        schema: {
            type: "object",
            properties: {
                lang: {
                    type: "string",
                    enum: ["eng", "fra"],
                    description: "The language of the search ('eng' for English or 'fra' for French).",
                },
                query: {
                    type: "string",
                    description: "The search terms to query on the canada.ca website. Extract a few terms from the question to make the query.",
                },
            },
            required: ["lang", "query"],
        },
    }
);

export default contextCanadaCASearch;
