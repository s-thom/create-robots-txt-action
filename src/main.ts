import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  setFailed,
  warning,
} from "@actions/core";
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
    if (getInput("input-file")) {
      promises.push(
        getFileContent().then((content) => {
          startChunk = content;
        }),
      );
    }

    let allowChunk: string | undefined;
    if (getBooleanInput("append-allow-rule")) {
      allowChunk = "User-agent: *\nAllow: /";
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

    const excludedBotNames = getMultilineInput("allowed-bot-names");
    for (const name of excludedBotNames) {
      blockedBotNames.delete(name);
    }

    let blockedChunk: string | undefined;
    if (blockedBotNames.size > 0) {
      const blockLines = Array.from(blockedBotNames)
        .sort()
        .map((name) => `User-agent: ${name}`)
        .join("\n");
      blockedChunk = `${blockLines}\nDisallow: /`;
    }

    const data = [startChunk, blockedChunk, allowChunk]
      .filter(Boolean)
      .join("\n\n");
    if (data.length > 0) {
      const addTrailingNewline = data.at(-1) !== "\n";

      await writeFile(outputFile, `${data}${addTrailingNewline ? "\n" : ""}`, {
        encoding: "utf8",
      });
    } else {
      warning("No robots.txt content to write");
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      setFailed(error.message);
      return;
    }
  }
}
