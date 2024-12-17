import { getInput, getMultilineInput, setFailed } from "@actions/core";
import { writeFile } from "node:fs/promises";
import { getFileContent } from "./file";
import { getCloudflareBots } from "./cloudflare";
import { getDarkVisitorsUserAgents } from "./dark-visitors";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const outputFile = getInput("output-file") || "robots.txt";
    if (!outputFile) {
      setFailed("No `output-file` set");
      return;
    }

    const promises: Promise<void>[] = [];

    let startChunk: string | undefined;
    const inputFile = getInput("input-file");
    if (inputFile) {
      promises.push(
        getFileContent().then((content) => {
          startChunk = content;
        }),
      );
    }

    const blockedBotNames = new Set<string>();

    if (getInput("cloudflare-api-token")) {
      promises.push(
        getCloudflareBots().then((bots) => {
          for (const bot of bots) {
            blockedBotNames.add(bot);
          }
        }),
      );
    }

    if (getInput("dark-visitors-api-token")) {
      promises.push(
        getDarkVisitorsUserAgents().then((bots) => {
          for (const bot of bots) {
            blockedBotNames.add(bot);
          }
        }),
      );
    }

    await Promise.all(promises);

    const excludedBotNames = getMultilineInput("exclude-bot-names");
    for (const name of excludedBotNames) {
      blockedBotNames.delete(name);
    }

    let blockedChunk: string | undefined;
    if (blockedBotNames.size > 0) {
      const blockLines = Array.from(blockedBotNames)
        .sort()
        .map((name) => `User-agent: ${name}`)
        .join("\n");
      blockedChunk = `${blockLines}\nDisallow: *`;
    }

    const data = [startChunk, blockedChunk].filter(Boolean).join("\n\n") + "\n";
    await writeFile(outputFile, data, { encoding: "utf8" });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
      return;
    }
  }
}
