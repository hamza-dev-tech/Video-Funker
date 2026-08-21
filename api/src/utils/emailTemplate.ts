interface OtpTemplateOptions {
    title: string;
    message: string;
    otp: string;
    expiryMinutes?: number;
}

export const createOtpTemplate = ({
    title,
    message,
    otp,
    expiryMinutes = 10,
}: OtpTemplateOptions): string => {
    const year = new Date().getFullYear();

    const escape = (str: string): string =>
        str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const safeTitle = escape(title);
    const safeMessage = escape(message);
    const safeOtp = escape(otp);
    const safeExpiry = Number(expiryMinutes);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4fb;min-height:100vh;">
    <tr>
      <td align="center" valign="top" style="padding:48px 16px;">

        <table width="560" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,64,143,0.10),0 1px 4px rgba(30,64,143,0.06);">

          <!-- Top accent bar: brand gradient -->
          <tr>
            <td style="background:linear-gradient(90deg,#1e408f 0%,#2a5abf 50%,#ff9a30 100%);height:5px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="left" style="padding:30px 40px 24px 40px;border-bottom:1px solid #eef2fb;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                <!-- Wordmark -->
                  <td valign="middle">
                    <span style="font-size:19px;font-weight:800;color:#1e408f;letter-spacing:-0.4px;">
                      Sales<span style="color:#ff9a30;">Lights</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px 40px;">

              <!-- Title -->
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#1e408f;letter-spacing:-0.4px;line-height:1.3;">
                ${safeTitle}
              </h1>

              <!-- Message -->
              <p style="margin:0 0 32px 0;font-size:15px;color:#4a5568;line-height:1.75;">
                ${safeMessage}
              </p>

              <!-- OTP label -->
              <p style="margin:0 0 10px 0;font-size:11px;font-weight:700;color:#ff9a30;letter-spacing:1.5px;text-transform:uppercase;">
                Your verification code
              </p>

              <!-- OTP block -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f5f8ff;border:2px solid #1e408f;border-radius:12px;padding:26px 20px;text-align:center;">
                    <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#1e408f;font-family:'Courier New',Courier,monospace;">
                      ${safeOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry pill -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#fff4e6;border:1px solid #ffd49a;border-radius:100px;padding:7px 16px;">
                    <span style="font-size:13px;color:#cc6f00;font-weight:600;">
                      &#9203;&nbsp; Expires in ${safeExpiry} minutes
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #eef2fb;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Security note -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="padding-right:10px;font-size:17px;line-height:1.4;">&#128274;</td>
                  <td>
                    <p style="margin:0;font-size:13px;color:#8a9bbf;line-height:1.7;">
                      If you didn&apos;t request this code, you can safely ignore this email.
                      Never share this code with anyone &mdash; Video Funker will never ask for it.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f8ff;border-top:1px solid #eef2fb;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:12px;color:#a0aec0;">&copy; ${year} Video Funker. All rights reserved.</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:#ff9a30;font-weight:600;">Illuminate your sales &#9728;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};