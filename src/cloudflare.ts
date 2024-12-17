import { getInput, getMultilineInput, error } from "@actions/core";
import Cloudflare, { APIError } from "cloudflare";

export async function getCloudflareBots(): Promise<Set<string>> {
  const cloudflareToken = getInput("cloudflare-api-token", { required: true });
  const botCategories = new Set(
    getMultilineInput("cloudflare-categories", {
      required: true,
    }),
  );

  const client = new Cloudflare({ apiToken: cloudflareToken });
  const response = await client.radar.verifiedBots.top
    .bots({
      dateRange: ["30d"],
      // This limit may need to be increased at some point.
      // For some reason it's crashing with higher limits. This appears to be a hidden limit with no guidance.
      limit: 300,
    })
    .catch((err) => {
      if (err instanceof APIError) {
        error(JSON.stringify(err.errors));
      }

      throw new Error("Error requesting top bots from Cloudflare");
    });

  const names = response.top_0
    .filter((bot) => botCategories.has(bot.botCategory))
    .map((bot) => bot.botName);

  return new Set(names);
}
