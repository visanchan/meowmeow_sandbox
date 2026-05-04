import "server-only";

export function renderInviteEmail(args: {
  brandName: string;
  code: string;
  expiresAt: string;
  registerUrl: string;
}) {
  const subject = `You're approved for the Cat Booth POS pilot — your invite code`;
  const html = `
    <div style="font-family:Aptos,'Segoe UI',sans-serif;background:#f6f0e6;padding:24px;color:#2b231d">
      <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid #ddcfbe;border-radius:20px;padding:28px">
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#6e4b27;margin:0 0 16px">
          Welcome, ${escape(args.brandName)}
        </h1>
        <p style="margin:0 0 12px;line-height:1.55">
          Your application is approved. Use the code below to create your workspace.
        </p>
        <div style="margin:22px 0;text-align:center">
          <div style="display:inline-block;padding:14px 22px;border-radius:14px;background:linear-gradient(180deg,#a9763f 0%,#7e552a 100%);color:#fffdf8;font-weight:900;letter-spacing:.18em;font-size:18px">
            ${escape(args.code)}
          </div>
        </div>
        <p style="margin:0 0 12px;line-height:1.55">
          Open <a href="${args.registerUrl}" style="color:#6e4b27">the registration page</a> and paste the code.
        </p>
        <p style="margin:0 0 12px;line-height:1.55;font-size:13px;color:#736555">
          The code expires on ${escape(args.expiresAt)}. It can be used only once.
        </p>
        <hr style="border:none;border-top:1px solid #ddcfbe;margin:18px 0">
        <p style="font-size:12px;color:#736555;margin:0;line-height:1.5">
          If you didn't apply, you can ignore this email.
        </p>
      </div>
    </div>
  `;
  return { subject, html };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
