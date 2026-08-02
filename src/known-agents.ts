import {
  endGroup,
  error,
  getInput,
  getMultilineInput,
  info,
  startGroup,
} from "@actions/core";

export async function getKnownAgentsUserAgents(): Promise<Set<string>> {
  const knownAgentsToken = getInput("known-agents-api-token", {
    required: true,
  });
  const botCategories = getMultilineInput("known-agents-categories", {
    required: true,
  });
  const baseRobotsTxt = await fetch("https://api.knownagents.com/robots-txts", {
    method: "POST",
    headers: new Headers({
      Authorization: `Bearer ${knownAgentsToken}`,
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      agent_types: botCategories,
      disallow: "/",
    }),
  })
    .then(async (response) => response.text())
    .catch((err) => {
      if (err instanceof Error) {
        error(err);
      }

      throw new Error("Error requesting robots.txt from Known Agents");
    });

  const userAgents = Array.from(baseRobotsTxt.matchAll(/^User-agent: (.*)$/gm))
    .map((match) => match[1])
    .sort();

  startGroup(`User agents from Known Agents (${userAgents.length})`);
  info(userAgents.join("\n"));
  endGroup();

  return new Set(userAgents);
}
