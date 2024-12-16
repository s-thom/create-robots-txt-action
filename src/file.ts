import * as core from "@actions/core";
import { readFile } from "node:fs/promises";

export async function getFileContent(): Promise<string> {
  const inputFile = core.getInput("input-file");

  const content = await readFile(inputFile, { encoding: "utf8" });

  return content;
}