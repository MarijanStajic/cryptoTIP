const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

http
    .createServer((req, res) => {
        const urlPath = decodeURIComponent(req.url.split("?")[0]);
        const relPath = urlPath === "/" ? "/index.html" : urlPath;
        const absPath = path.join(ROOT, relPath);

        fs.readFile(absPath, (err, data) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
                return res.end("404 Not Found");
            }
            const ext = path.extname(absPath).toLowerCase();
            res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
            res.end(data);
        });
    })
    .listen(PORT, () => console.log(`Frontend: http://localhost:${PORT}`));
