import pubsub, { EVENTS } from "./subscriptions";
import axios from "axios";

const fetchAPI = async () => {
  const response = await axios({
    method: "get",
    timeout: 1000,
    url:
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?symbol=BTC&convert=USD&amount=1",
    headers: { "X-CMC_PRO_API_KEY": process.env.API_KEY },
    withCredentials: true,
  })
    .then((res) => {
      return res.data.data;
    })
    .catch((err) => {
      console.log(
        "\x1b[32m%s\x1b[0m",
        "================================================="
      );
      console.log("ERROR", err);
      console.log(
        "\x1b[32m%s\x1b[0m",
        "================================================="
      );
    });

  return response;
};

module.exports = {
  pubsub,
  EVENTS,
  fetchAPI,
};
