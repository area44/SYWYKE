import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT_MS = 10000; // 10 seconds
const CONCURRENCY = 10;
const RETRY_DELAY_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, method) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });

    if (response.ok) {
      return { success: true, status: response.status };
    }
    return {
      success: false,
      status: response.status,
      error: `Status ${response.status} (${response.statusText})`,
    };
  } catch (error) {
    let errorMsg = "Unknown error";
    let isDnsError = false;

    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
        errorMsg = "Timeout after 10s";
      } else {
        errorMsg = error.message;
      }

      // Check Node's native fetch (undici) DNS errors safely
      const cause = error.cause;
      const causeCode = cause?.code || cause?.errno;
      if (causeCode === "ENOTFOUND" || error.message.includes("ENOTFOUND")) {
        isDnsError = true;
        errorMsg = `DNS lookup failed (${causeCode || "ENOTFOUND"})`;
      } else if (
        causeCode === "EAI_AGAIN" ||
        error.message.includes("EAI_AGAIN")
      ) {
        errorMsg = `Temporary DNS lookup failed (${causeCode || "EAI_AGAIN"})`;
      }
    }

    return { success: false, error: errorMsg, isDnsError };
  }
}

async function checkLink(site) {
  const url = site.url;
  let retries = 0;

  const attemptCheck = async () => {
    // 1. Try HEAD first
    let res = await fetchWithTimeout(url, "HEAD");
    let methodUsed = "HEAD";

    // 2. Fallback to GET if HEAD failed
    if (!res.success) {
      res = await fetchWithTimeout(url, "GET");
      methodUsed = "GET";
    }

    return {
      success: res.success,
      httpStatus: res.status,
      error: res.error,
      isDnsError: res.isDnsError,
      methodUsed,
    };
  };

  let check = await attemptCheck();

  // If it fails, retry once (only for network/dns failures or non-soft blocks)
  const isSoftBlock =
    check.httpStatus === 401 ||
    check.httpStatus === 403 ||
    check.httpStatus === 429;

  if (!check.success && !isSoftBlock) {
    retries++;
    await sleep(RETRY_DELAY_MS);
    check = await attemptCheck();
  }

  // Categorize result
  let status = "ALIVE";
  if (!check.success) {
    if (
      check.httpStatus === 404 ||
      check.httpStatus === 410 ||
      check.isDnsError
    ) {
      status = "DEAD";
    } else {
      status = "UNREACHABLE";
    }
  }

  return {
    site,
    status,
    httpStatus: check.httpStatus,
    error: check.error,
    methodUsed: check.methodUsed,
    retries,
  };
}

async function main() {
  console.log("Starting dead link check...");
  const sitesPath = join(process.cwd(), "src/content/sites.json");
  let sites = [];

  try {
    const rawData = readFileSync(sitesPath, "utf-8");
    sites = JSON.parse(rawData);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Failed to read/parse sites.json:", errorMessage);
    process.exit(1);
  }

  console.log(`Found ${sites.length} sites to check.`);

  const results = [];
  let activeIndex = 0;

  async function worker() {
    while (activeIndex < sites.length) {
      const currentIndex = activeIndex++;
      const site = sites[currentIndex];

      const progress = `[${currentIndex + 1}/${sites.length}]`;
      const result = await checkLink(site);
      results[currentIndex] = result;

      const retryText = result.retries > 0 ? " (after retry)" : "";

      if (result.status === "ALIVE") {
        console.log(
          `${progress} ✅ ${site.title} (${site.url}) - Success (${result.methodUsed})${retryText}`
        );
      } else if (result.status === "UNREACHABLE") {
        console.warn(
          `${progress} ⚠️  ${site.title} (${site.url}) - Unreachable/Blocked (${result.methodUsed})${retryText}: ${result.error}`
        );
      } else {
        console.error(
          `${progress} ❌ ${site.title} (${site.url}) - DEAD (${result.methodUsed})${retryText}: ${result.error}`
        );
      }
    }
  }

  const workers = [];
  const limit = Math.min(CONCURRENCY, sites.length);
  for (let i = 0; i < limit; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const dead = results.filter((r) => r.status === "DEAD");
  const unreachable = results.filter((r) => r.status === "UNREACHABLE");
  const alive = results.filter((r) => r.status === "ALIVE");

  console.log("\n====================================");
  console.log("Link Check Summary:");
  console.log(`Total sites checked: ${sites.length}`);
  console.log(`Active (Alive): ${alive.length}`);
  console.log(`Unreachable/Soft-fail: ${unreachable.length}`);
  console.log(`Dead (Critical): ${dead.length}`);
  console.log("====================================\n");

  const shouldWrite = process.argv.includes("--write");

  if (dead.length > 0) {
    console.error("Critical: The following DEAD links were detected:");
    for (const item of dead) {
      console.error(`- [${item.site.id}] ${item.site.title}: ${item.site.url}`);
      console.error(`  Reason: ${item.error}`);
    }

    if (shouldWrite) {
      console.log(
        "\nWriting back to sites.json with DEAD links filtered out..."
      );
      const deadIds = new Set(dead.map((d) => d.site.id));
      const filteredSites = sites.filter((s) => !deadIds.has(s.id));
      try {
        writeFileSync(
          sitesPath,
          `${JSON.stringify(filteredSites, null, 2)}\n`,
          "utf-8"
        );
        console.log(
          `Filtered sites written successfully. (Removed ${dead.length} dead links).`
        );
        process.exit(0); // exit 0 because they are handled
      } catch (writeErr) {
        console.error("Failed to write updated sites.json:", writeErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  } else {
    console.log("All links are active, healthy, or safely unreachable! 🎉");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("An unexpected error occurred during link check:", err);
  process.exit(1);
});
