import fs from 'node:fs/promises';
import path from 'node:path';
import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { htmlToText } from 'html-to-text';
import config from '../lib/config/config';
import { IUser } from '../models/userModel';

class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;

  constructor(user: IUser, url: string) {
    this.to = user.email;
    this.firstName = user.fullName.split(' ')[0];
    this.url = url;
    this.from = `The Wild Oasis | Admin Portal <${config.emailFrom}>`;
  }

  private newTransport() {
    // if (config.env === 'production') {
    //   // SendGrid
    //   return 1;
    // }

    return createTransport({
      host: config.mailtrapEmailTesting.smtpHost,
      port: config.mailtrapEmailTesting.smtpPort,
      auth: {
        user: config.mailtrapEmailTesting.smtpUsername,
        pass: config.mailtrapEmailTesting.smtpPassword,
      },
    });
  }

  private async send(template: string, subject: string) {
    // 1) Get HTML template
    const html = (
      await fs.readFile(
        path.join(__dirname, `../../emailTemplates/${template}.html`),
        'utf-8',
      )
    )
      .replace('{{user_name}}', this.firstName)
      .replace('{{next_step_link}}', this.url);

    // 2) Define mail options
    const mailOptions: Mail.Options = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // 3) Create a transporter and send email
    await this.newTransport().sendMail(mailOptions);
  }

  public async sendWelcome() {
    await this.send(
      'welcome',
      `Welcome to The Wild Oasis! Let's activate your account (Valid for ${config.emailVerificationToken.expiresInHrs} hrs)`,
    );
  }

  public async sendPasswordReset() {
    await this.send(
      'resetPassword',
      `Your reset password token (valid for ${config.resetPasswordToken.expiresInMins} mins)`,
    );
  }
}

export default Email;
