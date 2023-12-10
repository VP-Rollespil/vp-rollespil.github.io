import fs from "fs";
import ejs from "ejs";
import { XMLParser } from "fast-xml-parser";
import wiki2html from "./wikiToHtml.js";
const parser = new XMLParser();

let pages = getPageMap();

/**
 * Renders a page with the given data.
 * @param {string} page - The name of the page to render.
 * @param {Object} [data={}] - Additional data to pass to the page template.
 * @returns {Promise<{ success: boolean, html: string }>} - The rendered page HTML.
 */
async function pageRenderer(page, data = {}) {
	const pagePath = pages.get(page);
	if (!fs.existsSync(pagePath)) {
		return { success: false, error: "Page not found" };
	}

	const pageText = fs.readFileSync(pagePath).toString();
	const pageObject = parser.parse(pageText);
	if (!pageObject.text) return { success: false, error: "Page has no text" };
	let text = wiki2html(pageObject.text);

	const html = await ejs.renderFile("./views/page.ejs", {
		page: { ...pageObject, text },
		...data,
	});
	return { success: true, html };
}

/**
 * Retrieves a map of page names to page locations.
 * @returns {Map<string, string>} - The map of page names to page locations.
 */
function getPageMap() {
	let allPages = getPageLocations("");

	let pages = new Map();

	for (const page of allPages) {
		const fileName = page.split("/").pop();
		const pageName = fileName.replace(".xml", "");
		if (pages.has(pageName)) {
			console.log(`Duplicate page ${pageName}`);
			throw new Error(`Duplicate page ${pageName}`);
		}
		pages.set(pageName, page);
	}
	return pages;
}

let pageCounter = 0;

/**
 * Retrieves the locations of all pages in the specified directory.
 * @param {string} dir - The directory to search for pages.
 * @returns {string[]} - The array of page locations.
 */
function getPageLocations(dir) {
	let allPages = [];
	const pages = fs.readdirSync(`./pages/${dir}`);
	for (const element of pages) {
		if (element.endsWith(".xml")) {
			allPages.push(`./pages/${dir}${element}`);
		} else if (fs.lstatSync(`./pages/${dir}${element}`).isDirectory()) {
			allPages.push(...getPageLocations(`${dir}${element}/`));
		} else {
			console.log(`Unknown element ${element}`);
		}
	}
	return allPages;
}

export default pageRenderer;
export { pageRenderer, getPageLocations as getPageLocations, getPageMap };
