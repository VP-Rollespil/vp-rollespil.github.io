import express, { static as static_ } from "express";
const app = express();
import pageRenderer from "./pageRenderer.js";

app.set("view engine", "ejs");
app.use(static_("public"));

app.get("", (req, res) => {
	res.render("index", { title: "Home" });
});

app.get("/wiki/*", (req, res) => {
	const page = req.path.replace("/wiki/", "").replace(".html", "");
	const result = pageRenderer(`${page}`);
	if (result.error) {
		res.status(404).render("error", { title: "Error", error: result.error });
	} else {
		res.send(result.html);
	}
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});
