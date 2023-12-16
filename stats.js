import { getPageMap } from "./pageRenderer.js";
import fs from "fs";
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser();
let pages = getPageMap();

let links = new Map();
function findLinks(onlyPage = null) {
	if (onlyPage) pages = new Map([[onlyPage, pages.get(onlyPage)]]);
	let onlyPageLinks = [];
	//find all links and count them
	for (const page of pages) {
		const pageText = fs.readFileSync(page[1]).toString();
		const pageObject = parser.parse(pageText);
		if (!pageObject.text) continue;
		const text = pageObject.text;

		const matches = text.match(/\[\[.*?\]\]/g);
		if (!matches) continue;
		for (const match of matches) {
			const link = match
				.replace("[[", "")
				.replace("]]", "")
				.split("|")[0]
				.toLowerCase();
			if (links.has(link)) {
				if (onlyPage) onlyPageLinks.push(link);
				links.set(link, links.get(link) + 1);
			} else {
				if (onlyPage) onlyPageLinks.push(link);
				links.set(link, 1);
			}
		}
	}
	return onlyPageLinks;
}
function main() {
	//if called with argument, print links to that page
	if (process.argv[2]) {
		let pageLinks = findLinks(process.argv[2].toLowerCase());
		let page = process.argv[2].toLowerCase();
		console.log(page, links.get(page));
		console.log(pageLinks);
	} else {
		findLinks();
		//sort links by count and add to array
		let linksSorted = [...links.entries()].sort((a, b) => b[1] - a[1]);
		//print first 50 links to console
		linksSorted.slice(0, 50);
		linksSorted.forEach((link) => {
			if (link[1] < 8) return;
			console.log(link[0], link[1]);
		});
	}
}

main();
