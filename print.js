let book = process.argv[2];
let final = process.argv[3] == "true";
import { getPageMap, bookRenderer } from "./pageRenderer.js";
import fs from "fs";
import ejs from "ejs";
import htmlToPDFMake from "html-to-pdfmake";
import pdfMake from "pdfmake";
import { JSDOM } from "jsdom";
const { window } = new JSDOM();

var fonts = {
	Times: {
		normal: "Times-Roman",
		bold: "Times-Bold",
		italics: "Times-Italic",
		bolditalics: "Times-BoldItalic",
	},
};

let printer = new pdfMake(fonts);

if (!book) {
	console.log("No book specified.");
	process.exit(1);
}

let pages = getPageMap();
async function getbook() {
	let bookContent = await bookRenderer(`./books/${book}.wiki`);
	if (!bookContent.success) {
		console.log(`Failed to render book ${book}: ${bookContent.error}`);
		process.exit(1);
	}
	/*
	let bookHTMl = await ejs.renderFile("./views/book.ejs", {
		book: bookContent.book
		text: bookContent.text
	});

	return bookHTMl;*/

	return bookContent;
}

let bookHTML = await getbook();
let pdfContent = htmlToPDFMake(bookHTML.text, {
	window: window,
});

//Add cover
if (bookHTML.bookObject.cover && final) {
	//image takes a while to load, so only add it if we're making the final version
	pdfContent.unshift({
		image: "./public/images/" + bookHTML.bookObject.cover,
		alignment: "center",
		fit: [400, 550],
		margin: [0, 0, 0, 0],
	});
}

let dd = {
	pageSize: "A5", //417.6 pt by 597.6 pt
	content: pdfContent,
	pageBreakBefore: function (currentNode) {
		// break before all h1. this also makes a cover page
		return (
			currentNode.style &&
			(currentNode.style.indexOf("pdf-pagebreak-before") > -1 ||
				currentNode.style.indexOf("html-h1") > -1)
		);
	},

	header: function (currentPage, pageCount) {
		return {
			text: `${bookHTML.bookObject.title} `,
			alignment: "center",
			margin: [0, 20, 0, 0],
		};
	},
	footer: function (currentPage, pageCount) {
		//add page number on outer side of page
		return {
			text: `Side ${currentPage}`,
			alignment: currentPage % 2 ? "left" : "right",
			margin: [30, 0, 30, 0],
		};
	},
	defaultStyle: {
		font: "Times",
	},
	info: {
		title: bookHTML.bookObject.title,
		author: bookHTML.bookObject.author,
	},
};

let pdf = printer.createPdfKitDocument(dd);
pdf.pipe(fs.createWriteStream(`./build/books/${book}.pdf`));
pdf.end();
