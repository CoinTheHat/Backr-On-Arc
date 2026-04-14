const fs = require('fs');
const https = require('https');
const path = require('path');

const files = [
    // Home (v3)
    {
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzU4ZWYwY2JmYTY4NzQzZTA4ZDQ1Y2VmNjY5ZmYzNzdmEgsSBxCcwpuNqRUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NTk1MzU1MzE3OTk5MjY2MDQ2&filename=&opi=96797242",
        dest: "backer-app/public/home-v3.html"
    },
    {
        url: "https://lh3.googleusercontent.com/aida/AOfcidV2AkJjfBsziXOqfWhmu908FH5xJhX3Mg5vtD-paBc-z7Bo-C2QkmiVEEthDStiGETHYZI0ZCnVuU3m_-R0AAY3W418uE7OF1PonRKI9C91kAgKbdBXotwDr6jzR6-M8VEvl7flsSsdMKsTBljr3oys2zAlaWSQUKnay05s4R0a8asRBDYyJmdMOMU1WV6YMTB1zMxArkoGi3pQFLT1LtQf7g2Oq8_GL99Abhmxwem9diFq6CiIMNud9so",
        dest: "backer-app/public/home-v3.png"
    },
    // Dashboard
    {
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzE5ZWYyMzBhZjM1MTQ3ZjQ5ODliNjYyZjYxYmE4MzlmEgsSBxCcwpuNqRUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NTk1MzU1MzE3OTk5MjY2MDQ2&filename=&opi=96797242",
        dest: "backer-app/public/dashboard.html"
    },
    {
        url: "https://lh3.googleusercontent.com/aida/AOfcidXvW39dj7UJftli1eQqAT6qN4UGrzDzYC_a_p_zCcRQ6jeDw4tasbu4MC7bFsSOi1Sjd8jHcHxc2e67l_7i85BDZZ38qyHXhGoOQTLFOMNxe6ertUrNpPAkiV7sV8qpK6WMBAdJWSVy-cpdiR5tGBUBy0mtOy0WdFI1FiEPbmyKg29mrr19C732CbcZmHSvqwQ5On6AHgJU0tI2xOMg-L-wIhsJGJX-9h5kH0BMF4y2XqKQn7CRdoGy8w",
        dest: "backer-app/public/dashboard.png"
    },
    // Explore
    {
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2RkZmFlNTkzYmY5YTQ4N2ViZGY4ZmIxNmJiZTY0ZDc1EgsSBxCcwpuNqRUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NTk1MzU1MzE3OTk5MjY2MDQ2&filename=&opi=96797242",
        dest: "backer-app/public/explore.html"
    },
    {
        url: "https://lh3.googleusercontent.com/aida/AOfcidUqxIUbJJYE9REF7E5jLqZlZh6qQIi-KrLbeQP6qgXWI8e6GMlNCcDkhhUN5zaXHpHJBk-gwhtD46wXm1B6Mpl3V5RYwtu8LyVHf9q6qGo3kMaeLK-F2c_GXT3Ww7V1004600f7DfIC-vhSOGSKeweoWYUFqY76xkRLvPFfP48M0N-va7J0xbsifs4ekSAQX2rLdap6uzvMvZEiFHUk0OEX0LXTEzCwm9Wj1oX3t4s8MIDyNx3QyAqjNfQ",
        dest: "backer-app/public/explore.png"
    },
    // Profile
    {
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzcxNDY0ZDk4MDRmYzRhYmNhODI0Nzg3NjcyMmZjN2VkEgsSBxCcwpuNqRUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NTk1MzU1MzE3OTk5MjY2MDQ2&filename=&opi=96797242",
        dest: "backer-app/public/profile.html"
    },
    {
        url: "https://lh3.googleusercontent.com/aida/AOfcidVe0K-JQg5hCnXfcw43CV4ms8w-hEA___ugP5N3NUHtI6wXiEKXS9UiI9FB5OiQRY2URaWWwxSW7_5Wx-HhaFIwdywnw2e5V7RU-4ZIsBXEPvRQ3wVc2NGiejnEYrgFWMP9gTscPpSVY81AAStcO9-51Dp53oYpxDf7LOuUN6ZBnzNmRU4yr7Q_-x8P78x6XwwDIt6AJ3Z9qCbYRxWVLiW286oOp6e3B4Z_GeG4fzC8UN5oVFJnw0CFbp4",
        dest: "backer-app/public/profile.png"
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
        fs.unlink(dest, () => { });
        console.error(`Error downloading ${dest}: ${err.message}`);
    });
};

files.forEach(f => download(f.url, f.dest));
