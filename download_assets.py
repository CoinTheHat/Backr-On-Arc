import urllib.request
import os

html_url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzEwNTIxY2VhN2I5MjQxMWU4MTg0Y2ZmZWMzNjQ3ZDIwEgsSBxCcwpuNqRUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NTk1MzU1MzE3OTk5MjY2MDQ2&filename=&opi=96797242"
png_url = "https://lh3.googleusercontent.com/aida/AOfcidX8RmTRY_iehdeWpVazDeNRZatFngpkBXawSHS94v9xczjSs_ZPfbVoc3FQzsLT2VeDc1CkET8lkY2_B2HTC0HIfJxLKkncHB4DP9mrmD6OGA8ZySRndQQRnNOCjluRbaC_ZMdXNlaVI1UTePzoBEqVzh9nR4ZDJzD7qZDQ8JZFyS6-Nwy-Xnl7CClNrpXRt3Vo3EMrifgaj63eU9VNArAaxwR9EsrAptMfq96bSmqSr_Qulaaxlhgqc8M"

output_dir = "backer-app/public"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Downloading HTML to {output_dir}/home-v2.html...")
try:
    urllib.request.urlretrieve(html_url, f"{output_dir}/home-v2.html")
    print("HTML downloaded successfully.")
except Exception as e:
    print(f"Error downloading HTML: {e}")

print(f"Downloading PNG to {output_dir}/home-v2.png...")
try:
    urllib.request.urlretrieve(png_url, f"{output_dir}/home-v2.png")
    print("PNG downloaded successfully.")
except Exception as e:
    print(f"Error downloading PNG: {e}")
