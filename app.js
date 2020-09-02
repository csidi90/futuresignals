const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const app = express();
const talib = require("talib-binding");
const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: "<key>",
  APISECRET: "<secret>",
});

const PORT = process.env.PORT;
const interval = process.env.INTERVAL;
const closeIndex = 4;

app.use(bodyParser.json());
app.set("json spaces", 2);

app.get("/", function (req, res) {
  res.json(signals);
});
app.listen(PORT, function () {
  console.log("app running on " + PORT);

  setInterval(async function () {
    run();
  }, 30000);
});

let signals = [];

async function run() {
  try {
    let tempSignals = [];

    let symbols = Object.keys(await binance.futuresDaily());

    for (let s of symbols) {
      let candles = Object.values(await binance.futuresCandles(s, interval));

      if (shouldEnter(candles)) {
        tempSignals.push({
          symboL: s,
          side: "BUY",
        });
      }
      if (shouldExit(candles)) {
        tempSignals.push({
          symboL: s,
          side: "SELL",
        });
      }
    }

    signals.length = 0;

    for (let s in tempSignals) {
      signals.push(s);
    }
  } catch (error) {
    console.log(error);
  }
}

function shouldEnter(candles) {
  let closePrices = getKlineData(candles, closeIndex);
  let lastClose = closePrices[closePrices.length - 1];
  let previousClose = closePrices[closePrices.length - 2];
  let ema = talib.EMA(closePrices, 21);
  let emaValue = ema[ema.length - 1];

  let emaShort = talib.EMA(closePrices, 9);
  let emaShortValue = emaShort[emaShort.length - 1];

  if (
    previousClose <= emaValue &&
    lastClose >= emaValue &&
    emaShortValue > emaValue
  ) {
    return true;
  }

  return false;
}
function shouldExit(candles) {
  let closePrices = getKlineData(candles, closeIndex);
  let lastClose = closePrices[closePrices.length - 1];
  let previousClose = closePrices[closePrices.length - 2];
  let ema = talib.EMA(closePrices, 21);
  let emaValue = ema[ema.length - 1];

  let emaShort = talib.EMA(closePrices, 9);
  let emaShortValue = emaShort[emaShort.length - 1];

  if (
    previousClose >= emaValue &&
    lastClose <= emaValue &&
    emaShortValue < emaValue
  ) {
    return true;
  }

  return false;
}

function getKlineData(candles, index) {
  let data = [];
  for (let c of candles) {
    data.push(c[index]);
  }

  return data;
}
