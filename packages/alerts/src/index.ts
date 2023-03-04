import { Novu } from "@novu/node";
import { INovuConfiguration } from "@novu/node/build/main/lib/novu.interface";
import { WebhookClient } from "discord.js";

type AlertsOptions = {
  /**
   * NOVU API key
   */
  key: string;
  /**
   * Discord Webhook URL
   */
  webhook?: string;
  /**
   * Novu Configuration
   */
  config?: INovuConfiguration;
};

export class Alerts extends Novu {
  private webhook?: WebhookClient;
  constructor({ key, webhook, config }: AlertsOptions) {
    super(key, config);
    this.webhook = new WebhookClient({ url: webhook });
  }

  async sendVerificationEmail(
    verifyURL: string,
  ){}

}
