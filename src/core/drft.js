import { API } from "../api/api.js";
import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";
import WebSocket from "ws";

export class Drft extends API {
  constructor(account, query, queryObj) {
    super(
      query,
      "https://drftparty.fibrum.com",
      "drftparty.fibrum.com",
      "https://drftparty.fibrum.com/game"
    );
    this.account = account;
    this.query = query;
    this.queryObj = queryObj;
  }

  async login() {
    try {
      await Helper.delay(500, this.account, `Try to Login...`, this);
      const res = await this.fetch("/api/auth", "GET", undefined, undefined, {
        token: this.query,
      });

      await Helper.delay(1000, this.account, `Successfully Login`, this);
      this.user = res;
    } catch (error) {
      throw error;
    }
  }

  async initWss() {
    return new Promise(async (resolve, reject) => {
      await Helper.delay(1000, this.account, `Connecting to WSS...`, this);
      const socketUrl = `wss://drftparty.fibrum.com/ws?token=${Buffer.from(
        this.query
      ).toString("base64")}`;
      this.wss = new WebSocket(socketUrl, []);
      this.wss.on("open", async () => {
        await Helper.delay(1000, this.account, `WSS Connected...`, this);
      });

      this.wss.on("message", async (wssmsg) => {
        try {
          logger.info(
            `Receiving WSS Msg : ${JSON.stringify(JSON.parse(wssmsg))}`
          );
          const msg = JSON.parse(wssmsg);
          this.gameData = JSON.parse(msg.data);
          this.maxLevel = Math.max(
            ...this.gameData._grid.map((item) => item.level)
          );
          console.log(this.maxLevel);

          if (this.maxLevel < 200) {
            for (const item of Array(200 - this.maxLevel)) {
              await this.initGameData();
            }
          } else {
            await Helper.delay(
              1000,
              this.account,
              `Your max car level already > 200, skipping inject`,
              this
            );
          }
          resolve();
        } catch (error) {
          throw Error(`Error Parsing Msg : ${error.message}`);
        }
      });

      this.wss.on("error", async (error) => {
        reject(error);
      });

      this.wss.on("close", async () => {
        await Helper.delay(
          1000,
          this.account,
          `WSS Connection Closed...`,
          this
        );
      });
    });
  }

  async initGameData() {
    await Helper.delay(500, this.account, `Sending Modify Game Data...`, this);
    const grid = this.gameData._grid.map((item) => {
      item.level = this.maxLevel + 1;
      item.state = 1;
      return item;
    });

    // console.log(grid);

    const msg = {
      command: "set",
      data: JSON.stringify({
        _grid: grid,
        carPurchases: this.gameData.carPurchases,
        mergesCount: this.gameData.mergesCount + 6,
        currentTime: Math.floor(Date.now() / 1000),
        lastFixedTime: Math.floor(Date.now() / 1000),
        lastDropTime: this.gameData.lastDropTime,
        _boosts: this.gameData._boosts,
        airDropsQueue: [],
        cash:
          this.gameData.cash < 99999999999999999999999999999999
            ? 99999999999999999999999999999999
            : this.gameData.cash,
        settings: { sfx: false, music: false, haptics: true },
      }),
    };

    await this.wss.send(JSON.stringify(msg));
    this.gameData._grid = grid;
    this.maxLevel = Math.max(...this.gameData._grid.map((item) => item.level));
    await Helper.delay(1000, this.account, `Mod Data sended...`, this);
  }
}
