import { endGroup, getMultilineInput, info, startGroup } from "@actions/core";

export async function getManualUserAgents(): Promise<Set<string>> {
  const names = getMultilineInput("blocked-bot-names", { required: true });

  startGroup(`User agents from inputs (${names.length})`);
  info(names.join("\n"));
  endGroup();

  return new Set(names);
}