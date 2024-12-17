import { error, getInput, getMultilineInput } from "@actions/core";

export async function getDarkVisitorsUserAgents(): Promise<Set<string>> {
  const darkVisitorsToken = getInput("dark-visitors-api-token", {
    required: true,
  });
  const botCategories = getMultilineInput("dark-visitors-categories", {
    required: true,
  });
  const baseRobotsTxt = await fetch(
    "https://api.darkvisitors.com/robots-txts",
    {
      method: "POST",
      headers: new Headers({
        Authorization: `Bearer ${darkVisitorsToken}`,
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        agent_types: botCategories,
        disallow: "/",
      }),
    },
  )
    .then(async (response) => response.text())
    .catch((err) => {
      if (err instanceof Error) {
        error(err);
      }

      throw new Error("Error requesting robots.txt from Dark Visitors");
    });

  const userAgents = Array.from(
    baseRobotsTxt.matchAll(/^User-agent: (.*)$/gm),
  ).map((match) => match[1]);

  return new Set(userAgents);
}
