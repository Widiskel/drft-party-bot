import { Twisters } from "twisters";
import { Helper } from "./helper.js";
import logger from "./logger.js";
import { Drft } from "../core/drft.js";

class Twist {
  constructor() {
    /** @type  {Twisters}*/
    this.twisters = new Twisters();
  }

  /**
   * @param {string} acc
   * @param {Drft} Drft
   * @param {string} msg
   * @param {string} delay
   */
  log(msg = "", acc = "", drft = new Drft(), delay) {
    // console.log(acc);
    if (delay == undefined) {
      logger.info(`${acc.id} - ${msg}`);
      delay = "-";
    }

    const user = drft.user ?? {};
    const money = user.drft ?? "-";
    const gameData = drft.gameData ?? {};
    const grid = gameData._grid ?? [];

    const items = Array(12).fill("?");

    grid.forEach((item) => {
      if (item.position >= 0 && item.position < items.length) {
        items[item.position] = item.level;
      }
    });

    const gridDisplay = items.reduce((acc, curr, index) => {
      const position = index % 4 === 3 ? "\n" : " ";
      return acc + curr + position;
    }, "");

    this.twisters.put(acc.id, {
      text: `
================= Account ${acc.id} =============
Name      : ${acc.firstName} ${acc.lastName}
DRFT      : ${money}

GRID : 
${gridDisplay}

Status : ${msg}
Delay : ${delay}
==============================================`,
    });
  }
  /**
   * @param {string} msg
   */
  info(msg = "") {
    this.twisters.put(2, {
      text: `
==============================================
Info : ${msg}
==============================================`,
    });
    return;
  }

  clearInfo() {
    this.twisters.remove(2);
  }

  clear(acc) {
    this.twisters.remove(acc);
  }
}
export default new Twist();
