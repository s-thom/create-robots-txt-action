import * as core from "@actions/core";
import { writeFile } from "node:fs/promises";
import { getFileContent } from "./file";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const outputFile = core.getInput("output-file", { required: true });
    if (!outputFile) {
      core.setFailed("No `output-file` set");
      return;
    }

    const promises: Promise<string>[] = [];

    const inputFile = core.getInput("input-file");
    if (inputFile) {
      promises.push(getFileContent());
    }

    const chunks = await Promise.all(promises);
    const data = chunks.join("\n\n");
    await writeFile(outputFile, data, { encoding: "utf8" });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message);
      return;
    }
  }
}
