import { readFileSync, writeFileSync } from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
const parser = new XMLParser();
const builder = new XMLBuilder({ arrayNodeName: "page" });

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

for (let page of pagesXML) {
	//fix links to use [[link|text]] instead of [[link]]
	page.text = page.text.replace(/\[\[([^\|\]]+)\]\]/g, "[[$1|$1]]");

	let xmlContent = builder.build({
		title: page.title,
		author: page.author,
		timestamp: page.timestamp,
		text: page.text,
	});
	pagesText.push(xmlContent);
	writeFileSync(`../pages/${page.filename}.xml`, xmlContent, {
		encoding: "utf-8",
	});
}
