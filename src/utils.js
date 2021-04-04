import pubsub, { EVENTS } from "./subscriptions";
import axios from "axios";
import nodemailer from "nodemailer";
import { ApolloError } from "apollo-server";
import { hotp } from "otplib";

hotp.options = { digits: 6 }

const generateOTP = ({id}) => {
  const counter = (new Date()).getTime() + id
  return hotp.generate (process.env.OTP_SECRET, counter)
}


class EmailSender {
  constructor() {}

  async setTransporter() {
    this.transporter = await nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "testxcoins2021@gmail.com",
        pass: "pru?ba,020p=r0gr@m_cio-n",
      },
    });
  }

  async sendEmail({ to, subject, text }) {
    await this.transporter.sendMail(
      {
        from: "BTC/USD app",
        to,
        subject,
        text,
      },
      function (error) {
        if (error) {
          console.log(error);
          throw new ApolloError("Mail could not be sent");
        } else {
          console.log("Email sent");
          return true;
        }
      }
    );
  }
}



const generateEmailSender = async () => {
  const emailSender = new EmailSender();
  await emailSender.setTransporter();

  return emailSender;
};

const fetchAPI = async (shouldFetch) => {
  if (shouldFetch) {
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
  } else {
    return {
      last_updated: new Date(),
      quote: {
        USD: {
          price: (Math.random() * 59000 + 1).toString(),
        },
      },
    };
  }
};

module.exports = {
  pubsub,
  EVENTS,
  fetchAPI,
  EmailSender,
  generateEmailSender,
  generateOTP,
};
