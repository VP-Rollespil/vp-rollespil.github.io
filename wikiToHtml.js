/*
  @author: remy sharp / http://remysharp.com
  @url: http://remysharp.com/2008/04/01/wiki-to-html-using-javascript/
  @license: Creative Commons License - ShareAlike http://creativecommons.org/licenses/by-sa/3.0/
  @version: 1.0
  
  Can extend String or be used stand alone - just change the flag at the top of the script.
*/

/* Changed */

String.prototype.wiki2html = wiki2html;
String.prototype.iswiki = iswiki;

// utility function to check whether it's worth running through the wiki2html
function iswiki(s) {
	if (extendString) {
		s = this;
	}

	return !!s.match(/^[\s{2} `#\*='{2}]/m);
}

import { getPageMap } from "./pageRenderer.js";
import fs from "fs";
const pages = getPageMap();

let test = /(?:^|\n+)([^# =\*<\{].+)(?:\n+|$)/gm;

// the regex beast...
/**
 *
 * @param {string} s string to convert
 * @param {number} level level of recursion if adding wiki pages inside
 * @returns
 */
function wiki2html(s, stripMetadata = false, level = 0) {
	// lists need to be done using a function to allow for recusive calls
	function list(str) {
		return str.replace(/(?:(?:(?:^|\n)[\*#].*)+)/g, function (m) {
			// (?=[\*#])
			var type = m.match(/(^|\n)#/) ? "OL" : "UL";
			// strip first layer of list
			m = m.replace(/(^|\n)[\*#][ ]{0,1}/g, "$1");
			m = list(m);
			return (
				"<" +
				type +
				"><li>" +
				m.replace(/^\n/, "").split(/\n/).join("</li><li>") +
				"</li></" +
				type +
				">"
			);
		});
	}

	return list(
		s
			.replace(/\{\{(.*?)\}\}\n/g, function (m, l) {
				//is metadata?
				if (!l.match(/^wiki/i)) {
					return "";
				} else {
					return m;
				}
			})
			//TOC __TOC__ (not supported yet)
			.replace(/__TOC__/g, function (m, l) {
				return "";
			})
			/* BLOCK ELEMENTS */

			//todo: <p> matches too much? it seems like newlines in the start are a part of the capture group
			.replace(/(?:^|\n+)([^# =\*<].+)(?:\n+|$)/gm, function (m, l) {
				if (l.startsWith("{{")) return m; //I tried adding it to the regex, but it fucked everything up
				if (l.match(/^\^+$/)) return l;
				return "\n<p>" + l + "</p>\n";
			})

			.replace(/(?:^|\n)[ ]{2}(.*)+/g, function (m, l) {
				// blockquotes
				if (l.match(/^\s+$/)) return m;
				return "<blockquote>" + l + "</blockquote>";
			})

			.replace(/((?:^|\n)[ ]+.*)+/g, function (m) {
				// code
				if (m.match(/^\s+$/)) return m;
				return "<pre>" + m.replace(/(^|\n)[ ]+/g, "$1") + "</pre>";
			})

			.replace(/(?:^|\n)([=]+)(.*)\1/g, function (m, l, t) {
				// headings
				return "<h" + l.length + ">" + t + "</h" + l.length + ">";
			})

			/* INLINE ELEMENTS */
			.replace(/'''(.*?)'''/g, function (m, l) {
				// bold
				return "<strong>" + l + "</strong>";
			})

			.replace(/''(.*?)''/g, function (m, l) {
				// italic
				return "<em>" + l + "</em>";
			})
			.replace(/----/g, "<hr />")
			.replace(/--(.*?)--/g, function (m, l) {
				// strikethrough
				return "<strike>" + l + "</strike>";
			})
			.replace(/__(.*?)__/g, function (m, l) {
				// underline
				return "<underline>" + l + "</underline>";
			})

			.replace(/[^\[](http[^\[\s]*)/g, function (m, l) {
				// normal link
				return '<a href="' + l + '">' + l + "</a>";
			})

			.replace(/\[(http.*)[!\]]/g, function (m, l) {
				// external link
				var p = l.replace(/[\[\]]/g, "").split(/\|/);
				var link = p.shift();
				return (
					'<a href="' + link + '">' + (p.length ? p.join(" ") : link) + "</a>"
				);
			})

			.replace(/\[\[(.*?)\]\]/g, function (m, l) {
				// internal link or image
				var p = l.split(/\|/);
				var link = p.shift();

				if (link.match(/^Image:(.*)/)) {
					// no support for images - since it looks up the source from the wiki db :-(
					return m;
				} else {
					let page = link.toLowerCase().split("/").pop();
					if (pages.has(page)) {
						return (
							'<a class="active" href="/wiki/' +
							page +
							'.html">' +
							(p.length ? p.join("|") : link) +
							"</a>"
						);
					} else {
						return (
							'<a class="inactive">' + (p.length ? p.join("|") : link) + "</a>"
							/*'<a disabled class="inactive" href="/wiki/' +
							page +
							'.html">' +
							(p.length ? p.join("|") : link) +
							"</a>"*/
						);
					}
				}
			})

			//find {{wiki PAGEHERE}}
			.replace(/\{\{(.*?)\}\}/g, function (m, l) {
				//is wiki template?
				if (!l.match(/^wiki /i)) return m;

				if (level > 2) throw new Error("Too many nested wikis");

				l = l.split(" ");
				l.shift();
				let page = l.join(" ").toLowerCase();
				if (pages.has(page)) {
					let data = fs.readFileSync(pages.get(page), "utf8");
					let html = wiki2html(data, stripMetadata, level + 1).trim();
					console.log(html);
					return html;
				}
				console.log("No page found for " + page);
				return m;
			})
	);
}

export default wiki2html;
export { wiki2html, iswiki };

/*
import wikity from "wikity";
import { JSDOM } from "jsdom";
function parseWiki(wiki) {
	let htmltext =
		"<html><body>" +
		wikity.parse(wiki, {
			templatesFolder: "./pages/",
		}) +
		"</body></html>";
	let htmlDoc = new JSDOM(htmltext);

	//Find all internal links
	let links = htmlDoc.window.document.getElementsByTagName("a");
	for (let link of links) {
		//is it not a wiki link?
		if (!link.getAttribute("href")) continue;
		if (link.getAttribute("href").startsWith("http")) continue;
		if (link.getAttribute("href").startsWith("#")) continue;
		if (link.getAttribute("href").startsWith("./")) continue;

		let page = link.getAttribute("href").toLowerCase().split("/").pop();
		if (pages.has(page)) {
			link.setAttribute("href", "/wiki/" + page + ".html");
			link.classList.add("active");
		} else {
			link.removeAttribute("href");
			link.classList.add("inactive");
		}
	}

	let html = htmlDoc.window.document.body.innerHTML;
	return html;
} 
export default parseWiki;
export { parseWiki as wiki2html };*/
