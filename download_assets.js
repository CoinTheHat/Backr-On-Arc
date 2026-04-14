const fs = require('fs');
const https = require('https');
const path = require('path');

const files = [
    {
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzEwNTIxY2VhN2I5MjQxMWU4MTg0Y2ZmZWMzNjQ3ZDIwEgsSBxCcwpuNqRUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NTk1MzU1MzE3OTk5MjY2MDQ2&filename=&opi=96797242",
        dest: "backer-app/public/home-v2.html"
    },
    {
        url: "https://lh3.googleusercontent.com/aida/AOfcidX8RmTRY_iehdeWpVazDeNRZatFngpkBXawSHS94v9xczjSs_ZPfbVoc3FQzsLT2VeDc1CkET8lkY2_B2HTC0HIfJxLKkncHB4DP9mrmD6OGA8ZySRndQQRnNOCjluRbaC_ZMdXNlaVI1UTePzoBEqVzh9nR4ZDJzD7qZDQ8JZFyS6-Nwy-Xnl7CClNrpXRt3Vo3EMrifgaj63eU9VNArAaxwR9EsrAptMfq96bSmqSr_Qulaaxlhgqc8M",
        dest: "backer-app/public/home-v2.png"
    }
];

const download = (url, dest) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    console.log(`Downloading to ${dest}...`);

    https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            return download(response.headers.location, dest);
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${dest}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest, () => { }); // Delete the file async. (But we don't check for failure)
        console.error(`Error downloading ${dest}: ${err.message}`);
    });
};

files.forEach(f => download(f.url, f.dest));
