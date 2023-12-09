import express, { static as static_ } from "express";
const app = express();
import pageRenderer, { getPages } from "./pageRenderer.js";
import fs from "fs";

app.set("view engine", "ejs");
app.use("/public", static_("public/"));

app.get("", (req, res) => {
	res.render("index", { title: "Home" });
});

app.get("/wiki/*", async (req, res) => {
	const page = req.path.replace("/wiki/", "").replace(".html", "");
	const result = await pageRenderer(`${page}`);
	if (result.error) {
		res.status(404).render("error", { title: "Error", error: result.error });
	} else {
		res.send(result.html);
	}
});

app.get("/move", (req, res) => {
	res.render("move", {
		pages: getPages("").map((page) =>
			page.replace(".xml", "").replace("./pages/", "")
		),
	});
});

app.use(express.json());
app.post("/move", (req, res) => {
	const { from, to } = req.body;
	console.log(req.body);
	if (from && to) {
		fs.renameSync(`./pages/${from}.xml`, `./pages/${to}.xml`);
		console.log(`Moved ${from} to ${to}`);
		res.status(200).send("Moved");
	} else {
		res.status(400).send("Bad request");
	}
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});
