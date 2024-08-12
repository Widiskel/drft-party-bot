import input from "input";
import { Helper } from "../utils/helper.js";
import { Config } from "../config/config.js";
import { Api, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/StoreSession.js";
import logger from "../utils/logger.js";
import { FloodWaitError } from "telegram/errors/RPCErrorList.js";

export class Telegram {
  storeSession;

  constructor() {
    this.sessionName = "sessions";
    this.url = "https://Drft-prod.tonfarmer.com/";
  }

  async init() {
    try {
      await this.onBoarding();
    } catch (error) {
      console.log(error);
      logger.error(`${JSON.stringify(error)}`);
      throw error;
    }
  }
  async onBoarding() {
    try {
      let ctx =
        "Welcome to Drft Bot \nBy : Widiskel \n \nLets getting started.\n\nYour Session List:\n";
      const sessionList = Helper.getSession("sessions");

      if (sessionList.length == 0) {
        ctx += "<empty> \n \nPlease enter Session Name :";
      } else {
        for (const sess of sessionList) {
          ctx += `- ${sess}\n`;
        }
      }
      ctx += "\n \nPlease Choose a menu: \n";
      ctx +=
        "\n \n1. Create Session. \n2. Reset Sessions \n3. Start Bot \n \nInput your choice :";
      const choice = await input.text(ctx);
      if (choice == 1) {
        await this.sessionCreation();
      } else if (choice == 2) {
        Helper.resetSession(this.sessionName);
        await Helper.delay(3000);
        await this.onBoarding();
      } else if (choice == 3) {
        if (Helper.getSession(this.sessionName)?.length == 0) {
          console.info("You don't have any sessions, please create first");
          await this.onBoarding();
        }
      } else {
        console.error("Invalid input, Please try again");
        await this.onBoarding();
      }
    } catch (error) {
      throw error;
    }
  }
  async sessionCreation() {
    try {
      const sessionList = Helper.getSession("sessions");
      let ctx = "Your session List :\n \n";

      for (const sess of sessionList) {
        ctx += `${sessionList.indexOf(sess) + 1}. ${sess}\n`;
      }
      if (sessionList.length == 0) {
        ctx += "<empty> \n \nPlease enter Session Name :";
      } else {
        ctx +=
          "\n \nYou alreay have sessions, cancel(CTRL+C) or create new Session :";
      }

      const newSession = await input.text(ctx);
      this.sessionName = Helper.createDir(newSession);
      await this.useSession(this.sessionName);
      await this.disconnect();
      logger.info(`Session ${this.sessionName} - Created`);
      console.log(`Session ${this.sessionName} - Created`);
      this.storeSession.save();
      await Helper.delay(3000);
      await this.init();
    } catch (error) {
      throw error;
    }
  }

  async useSession(sessionName) {
    try {
      this.storeSession = new StoreSession(sessionName);
      this.client = new TelegramClient(
        this.storeSession,
        Config.TELEGRAM_APP_ID,
        Config.TELEGRAM_APP_HASH,
        {
          connectionRetries: 5,
        }
      );
      this.storeSession.save();

      await this.client.start({
        phoneNumber: async () =>
          await input.text("Enter your Telegram Phone Number ?"),
        password: async () => await input.text("Enter your Telegram Password?"),
        phoneCode: async () =>
          await input.text("Enter your Telegram Verification Code ?"),
        onError: (err) => {
          console.log(err.message);
        },
      });
      console.log();
    } catch (error) {
      throw error;
    }
  }

  async resolvePeer() {
    try {
      logger.info(`Session ${this.session} - Resolving Peer`);
      while (this.peer == undefined) {
        try {
          this.peer = await this.client.getEntity("drft_party_bot");
          break;
        } catch (error) {
          if (error instanceof FloodWaitError) {
            const fls = error.seconds;

            logger.warn(
              `${this.client.session.serverAddress} | FloodWait ${error}`
            );
            logger.info(`${this.client.session.serverAddress} | Sleep ${fls}s`);

            await Helper.delay((fls + 3) * 1000);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async disconnect() {
    await this.client.disconnect();
    await this.client.destroy();
    this.peer = undefined;
    this.sessionName = undefined;
  }

  async initWebView() {
    try {
      const webView = await this.client.invoke(
        new Api.messages.RequestWebView({
          peer: this.peer,
          bot: this.peer,
          fromBotMenu: true,
          url: this.url,
          platform: "android",
        })
      );
      logger.info(`Session ${this.session} - Webview Connected`);
      // https://clicker.Drft.exchange/#tgWebAppData=query_id%3DAAGnbflTAgAAAKdt-VOyCnnH%26user%3D%7B%22id%22%3A5703822759%2C%22first_name%22%3A%22Widi%22%2C%22last_name%22%3A%22Saputro%22%2C%22username%22%3A%22Wskel%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D%26auth_date%3D1719831259%26hash%3De2647dd46bb9308103b20c27ba75fe8343295eed09f53d2bc927a59975d0f3c4&tgWebAppVersion=7.6&tgWebAppPlatform=tdesktop&tgWebAppThemeParams={"accent_text_color"%3A"%23168acd"%2C"bg_color"%3A"%23ffffff"%2C"button_color"%3A"%2340a7e3"%2C"button_text_color"%3A"%23ffffff"%2C"destructive_text_color"%3A"%23d14e4e"%2C"header_bg_color"%3A"%23ffffff"%2C"hint_color"%3A"%23999999"%2C"link_color"%3A"%23168acd"%2C"secondary_bg_color"%3A"%23f1f1f1"%2C"section_bg_color"%3A"%23ffffff"%2C"section_header_text_color"%3A"%23168acd"%2C"section_separator_color"%3A"%23e7e7e7"%2C"subtitle_text_color"%3A"%23999999"%2C"text_color"%3A"%23000000"}
      const authUrl = webView.url;
      // console.log(authUrl);
      return Helper.getTelegramQuery(authUrl, 3);
    } catch (error) {
      throw error;
    }
  }
}
