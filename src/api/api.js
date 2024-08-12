import { Helper } from "../utils/helper.js";
import logger from "../utils/logger.js";

export class API {
  constructor(query, url, host, ref) {
    this.url = url;
    this.host = host;
    this.ref = ref;
    this.ua = Helper.randomUserAgent();
    this.query = query;
  }

  generateHeaders(token) {
    const headers = {
      Accept: "*/*",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      Priority: "u=3, i",
      "If-None-Match": 'W/"17f-+OPifTPvsOmXnCZBTm6WTMs0KCc"',
      // "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Ch-Ua": this.ua,
      "User-Agent": this.ua,
      Host: this.host,
    };

    if (token) {
      headers.Authorization = token;
    }

    return headers;
  }

  async fetch(endpoint, method, token, body = {}, additionalHeader = {}) {
    try {
      const url = `${this.url}${endpoint}`;
      const headers = {
        ...additionalHeader,
        ...this.generateHeaders(token),
      };
      const options = {
        cache: "default",
        credentials: "include",
        headers,
        method,
        mode: "cors",
        redirect: "follow",
        Referer: this.ref,
        referrerPolicy: "strict-origin-when-cross-origin",
      };
      logger.info(`${method} : ${url}`);
      logger.info(`Request Header : ${JSON.stringify(headers)}`);

      if (method !== "GET") {
        options.body = `${JSON.stringify(body)}`;
        logger.info(`Request Body : ${options.body}`);
      }

      const res = await fetch(url, options);

      logger.info(`Response : ${res.status} ${res.statusText}`);
      if (res.ok || res.status == 400) {
        const data = await res.json();
        logger.info(`Response Data : ${JSON.stringify(data)}`);
        return data;
      } else {
        throw new Error(`${res.status} - ${res.statusText}`);
      }
    } catch (err) {
      logger.error(`Error : ${err.message}`);
      throw err;
    }
  }
}
