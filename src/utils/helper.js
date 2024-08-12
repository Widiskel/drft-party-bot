// import moment from "moment";
import moment from "moment-timezone";
import fs from "fs";
import path from "path";
import { parse, stringify } from "querystring";
import twist from "./twist.js";

export class Helper {
  static delay = (ms, acc, msg, obj) => {
    return new Promise((resolve) => {
      let remainingMilliseconds = ms;

      if (acc != undefined) {
        twist.log(msg, acc, obj, `Delaying for ${this.msToTime(ms)}`);
      } else {
        twist.info(`Delaying for ${this.msToTime(ms)}`);
      }

      const interval = setInterval(() => {
        remainingMilliseconds -= 1000;
        if (acc != undefined) {
          twist.log(
            msg,
            acc,
            obj,
            `Delaying for ${this.msToTime(remainingMilliseconds)}`
          );
        } else {
          twist.info(`Delaying for ${this.msToTime(remainingMilliseconds)}`);
        }

        if (remainingMilliseconds <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        await twist.clearInfo();
        if (acc) {
          twist.log(msg, acc, obj);
        }
        resolve();
      }, ms);
    });
  };

  static randomUserAgent() {
    const list_useragent = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/125.2535.60 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
    ];
    return list_useragent[Math.floor(Math.random() * list_useragent.length)];
  }

  static readTime(milliseconds) {
    const date = moment.unix(milliseconds);
    return date.format("YYYY-MM-DD HH:mm:ss");
  }

  static getCurrentTimestamp() {
    const timestamp = moment().tz("Asia/Singapore").unix();
    return timestamp.toString();
  }

  static getSession(sessionName) {
    try {
      const sessionsPath = "sessions";
      if (!fs.existsSync(sessionsPath)) {
        fs.mkdirSync(sessionsPath);
      }
      const files = fs.readdirSync(path.resolve(sessionName));
      const session = [];
      files.forEach((file) => {
        session.push(file);
      });
      return session;
    } catch (error) {
      throw Error(`Error reading sessions directory: ${error},`);
    }
  }

  static resetSession(sessionName) {
    try {
      const files = fs.readdirSync(path.resolve(sessionName));
      console.log("Deleting Sessions...");
      files.forEach((file) => {
        fs.rm(
          `${path.join(path.resolve("sessions"), file)}`,
          { recursive: true },
          (err) => {
            if (err) throw err;
          }
        );
      });
      console.info("Sessions reset successfully");
    } catch (error) {
      throw Error(`Error deleting session files: ${error},`);
    }
  }

  static getTelegramQuery(url, type) {
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) {
      throw new Error("No query string found in the URL.");
    }

    const queryString = url.substring(hashIndex + 1);
    const decodedQueryString = queryString.split("&");
    const param = decodedQueryString[0]
      .split("&")[0]
      .replace("tgWebAppData=", "");

    if (!param) {
      throw new Error("Param not found in the query string.");
    }

    if (type == "1") {
      return param;
    } else if (type == "2") {
      return this.decodeQueryString(param);
    } else {
      const newParam = this.decodeQueryString(param);
      return this.jsonToInitParam(newParam);
    }
  }

  static jsonToInitParam(dataString) {
    const newData = parse(dataString);

    if (newData.user) {
      const userObject = JSON.parse(newData.user);
      newData.user = encodeURIComponent(JSON.stringify(userObject));
    }

    const resultArray = [];
    for (const [key, value] of Object.entries(newData)) {
      resultArray.push(`${key}=${value}`);
    }
    const result = resultArray.join("&");

    return result;
  }

  static decodeQueryString(encodedString) {
    const decodedString = decodeURIComponent(encodedString);
    const paramsArray = decodedString.split("&");
    const paramsObject = {};

    paramsArray.forEach((param) => {
      const [key, value] = param.split("=");
      if (key === "user") {
        paramsObject[key] = JSON.parse(decodeURIComponent(value));
      } else {
        paramsObject[key] = value;
      }
    });

    const resultArray = [];
    for (const [key, value] of Object.entries(paramsObject)) {
      if (key === "user") {
        resultArray.push(`${key}=${JSON.stringify(value)}`);
      } else {
        resultArray.push(`${key}=${value}`);
      }
    }

    return resultArray.join("&");
  }

  static createDir(dirName) {
    try {
      const sessionsPath = "sessions";
      const dirPath = path.join(sessionsPath, dirName);

      if (!fs.existsSync(sessionsPath)) {
        fs.mkdirSync(sessionsPath);
      }

      fs.mkdirSync(dirPath, { recursive: true });

      console.log(dirPath);
      return dirPath;
    } catch (error) {
      throw new Error(`Error creating directory: ${error}`);
    }
  }

  static random(min, max) {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return rand;
  }

  static msToTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const remainingMillisecondsAfterHours = milliseconds % (1000 * 60 * 60);
    const minutes = Math.floor(remainingMillisecondsAfterHours / (1000 * 60));
    const remainingMillisecondsAfterMinutes =
      remainingMillisecondsAfterHours % (1000 * 60);
    const seconds = Math.round(remainingMillisecondsAfterMinutes / 1000);

    return `${hours} Hours ${minutes} Minutes ${seconds} Seconds`;
  }

  static queryToJSON(query) {
    const queryObject = {};
    const pairs = query.split("&");

    pairs.forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key === "user") {
        queryObject[key] = JSON.parse(decodeURIComponent(value));
      } else {
        queryObject[key] = decodeURIComponent(value);
      }
    });

    return queryObject;
  }
}
