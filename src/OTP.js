import { totp } from "otplib";

class OTP {
  constructor(secret, step) {
    this.secret = secret
    this.totp = totp
    this.totp.options = { digits: 6, step, epoch: Date.now() };
  }

  async generateOTP () {
    const token = await this.totp.generate(this.secret);
    return token;
  }

  async validateOTP ({ otp }) {
    const isValid = await totp.verify({token: otp, secret: this.secret})
    return isValid
  }
}


export default OTP