import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
const parser = new XMLParser();
const builder = new XMLBuilder({ format: true });

const xmlData = readFileSync("import.xml", "utf-8");
const parsedData = parser.parse(xmlData);

let pagesXML = [];

for (let page of parsedData.mediawiki.page) {
	pagesXML.push({
		title: page.title,
		author: page.revision.contributor.username,
		timestamp: page.revision.timestamp,
		filename: page.filename,
		text: page.revision.text,
	});
}

let pagesText = [];
mkdirSync("../pages", { recursive: true });
for (let page of pagesXML) {
	//fix links to use [[link|text]] instead of [[link]]
	page.text = page.text.replace(/\[\[([^\|\]]+)\]\]/g, "[[$1|$1]]");

	//find largest heading (highest level is 1)
	let highestLevel = 0;
	for (let i = 1; i <= 6; i++) {
		if (page.text.match(new RegExp(`={${i}}([^=\n]+)={${i}}\s*\n`, "g"))) {
			highestLevel = i;
			break;
		}
	}

	//move headings so the highest level is 4
	let difference = 4 - highestLevel;
	if (difference > 0) {
		for (let i = 0; i < difference; i++) {
			if (page.text.match(/^={6}[^=]/gm)) {
				console.log(`Page ${page.title} has a heading of level 6`);
			}
			page.text = page.text
				.replace(/={5}([^=\n]+)={5}\s*\n/g, "======$1======\n")
				.replace(/={4}([^=\n]+)={4}\s*\n/g, "=====$1=====\n")
				.replace(/={3}([^=\n]+)={3}\s*\n/g, "====$1====\n")
				.replace(/={2}([^=\n]+)={2}\s*\n/g, "===$1===\n")
				.replace(/={1}([^=\n]+)={1}\s*\n/g, "==$1==\n");
		}
	} else if (difference < 0) {
		console.log(`Page ${page.title} has a heading of level ${highestLevel}`);
		for (let i = 0; i < -difference; i++) {
			if (page.text.match(/^={1}[^=]/gm)) {
				console.log(`Page ${page.title} has a heading of level 1`);
			}
			page.text = page.text
				.replace(/={2}([^=\n]+)={2}\s*\n/g, "=$1=\n")
				.replace(/={3}([^=\n]+)={3}\s*\n/g, "==$1==\n")
				.replace(/={4}([^=\n]+)={4}\s*\n/g, "===$1===\n")
				.replace(/={5}([^=\n]+)={5}\s*\n/g, "====$1====\n")
				.replace(/={6}([^=\n]+)={6}\s*\n/g, "=====$1=====\n");
		}
	}

	//log all pages with headings of level 1, 2 and 3
	if (page.text.match(/^==[^=]/gm)) {
		console.log(`Page ${page.title} has heading of a high level`);
	}

	let xmlContent = builder.build({
		title: page.title,
		author: page.author,
		timestamp: page.timestamp,
		text: page.text,
		copyright: page.title,
	});
	pagesText.push(xmlContent);
	writeFileSync(`../pages/${page.filename.toLowerCase()}.xml`, xmlContent, {
		encoding: "utf-8",
	});
}
