import { formatDate, formatTime } from "./utils";

/* Plain, widely-compatible HTML emails (inline styles, table layout) with a text alternative. */

export type Rendered = { subject: string; html: string; text: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

const when = (date: Date | string, time: string) =>
  `${formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${formatTime(time)}`;

function layout(opts: { preheader: string; heading: string; body: string; cta?: { label: string; url: string }; footer?: string }) {
  const cta = opts.cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;background:#174e3c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${escapeHtml(opts.cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1c1917">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4">
<tr><td style="height:6px;background:linear-gradient(90deg,#e3a92b 0 33%,#174e3c 33% 66%,#d9633d 66%)"></td></tr>
<tr><td style="padding:24px 28px 0;font-size:20px;font-weight:700;color:#174e3c">Efie <span style="color:#d9633d">Homes</span></td></tr>
<tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:22px;font-weight:700;padding-bottom:12px">${escapeHtml(opts.heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;padding-bottom:16px">${opts.body}</td></tr>
${cta}
</table></td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #f5f5f4;font-size:12px;color:#78716c;line-height:1.5">${opts.footer ?? "You're receiving this because you have an account on Efie Homes."}<br>Always inspect a property in person before paying any advance.</td></tr>
</table></td></tr></table></body></html>`;
}

function detailRows(rows: [string, string][]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f3ede3;border-radius:12px;margin:12px 0">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px;font-size:13px;color:#57534e;width:120px;vertical-align:top">${escapeHtml(k)}</td><td style="padding:8px 14px;font-size:14px;font-weight:600">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

const quote = (text: string) =>
  `<div style="border-left:3px solid #d9633d;padding:8px 12px;margin:12px 0;color:#44403c;white-space:pre-line">${escapeHtml(text)}</div>`;

/* ------------------------------------------------------------------ */

export function viewingRequestedEmail(p: {
  landlordName: string;
  tenantName: string;
  tenantPhone: string;
  propertyTitle: string;
  date: Date | string;
  time: string;
  message: string;
  dashboardUrl: string;
}): Rendered {
  const subject = `New viewing request: ${p.propertyTitle}`;
  const rows: [string, string][] = [
    ["Property", p.propertyTitle],
    ["Requested by", p.tenantName],
    ["When", when(p.date, p.time)],
    ["Phone", p.tenantPhone],
  ];
  return {
    subject,
    html: layout({
      preheader: `${p.tenantName} would like to view ${p.propertyTitle}.`,
      heading: "You have a new viewing request",
      body: `Hi ${escapeHtml(firstName(p.landlordName))},<br>${escapeHtml(p.tenantName)} would like to view your property.${detailRows(rows)}Their message:${quote(p.message)}`,
      cta: { label: "Confirm or decline", url: p.dashboardUrl },
    }),
    text: [
      `Hi ${firstName(p.landlordName)},`,
      ``,
      `${p.tenantName} would like to view your property.`,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      ``,
      `Their message:`,
      p.message,
      ``,
      `Confirm or decline: ${p.dashboardUrl}`,
    ].join("\n"),
  };
}

export function viewingAnsweredEmail(p: {
  tenantName: string;
  landlordName: string;
  landlordPhone: string | null;
  propertyTitle: string;
  status: "CONFIRMED" | "DECLINED";
  date: Date | string;
  time: string;
  note?: string | null;
  propertyUrl: string;
  dashboardUrl: string;
}): Rendered {
  const confirmed = p.status === "CONFIRMED";
  const subject = confirmed ? `Viewing confirmed: ${p.propertyTitle}` : `Viewing request declined: ${p.propertyTitle}`;
  const rows: [string, string][] = [
    ["Property", p.propertyTitle],
    ["When", when(p.date, p.time)],
    ["Landlord", p.landlordName],
    ...(confirmed && p.landlordPhone ? ([["Phone", p.landlordPhone]] as [string, string][]) : []),
  ];
  const intro = confirmed
    ? `Good news! ${escapeHtml(p.landlordName)} has confirmed your viewing.`
    : `${escapeHtml(p.landlordName)} can't accommodate your viewing request this time.`;
  const after = confirmed ? "" : "<br>There are plenty more homes on Efie Homes. Have a look at similar listings nearby.";
  return {
    subject,
    html: layout({
      preheader: confirmed ? `See you on ${when(p.date, p.time)}.` : `Your request for ${p.propertyTitle} was declined.`,
      heading: confirmed ? "Your viewing is confirmed" : "Your viewing request was declined",
      body: `Hi ${escapeHtml(firstName(p.tenantName))},<br>${intro}${detailRows(rows)}${p.note ? `Note from the landlord:${quote(p.note)}` : ""}${after}`,
      cta: confirmed ? { label: "View the listing", url: p.propertyUrl } : { label: "See my viewings", url: p.dashboardUrl },
    }),
    text: [
      `Hi ${firstName(p.tenantName)},`,
      ``,
      confirmed ? `Good news! ${p.landlordName} has confirmed your viewing.` : `${p.landlordName} can't accommodate your viewing request this time.`,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      ...(p.note ? ["", "Note from the landlord:", p.note] : []),
      ``,
      confirmed ? `Listing: ${p.propertyUrl}` : `Your viewings: ${p.dashboardUrl}`,
    ].join("\n"),
  };
}

export function viewingCancelledEmail(p: {
  landlordName: string;
  tenantName: string;
  propertyTitle: string;
  date: Date | string;
  time: string;
  dashboardUrl: string;
}): Rendered {
  const subject = `Viewing request cancelled: ${p.propertyTitle}`;
  return {
    subject,
    html: layout({
      preheader: `${p.tenantName} cancelled their viewing request.`,
      heading: "A viewing request was cancelled",
      body: `Hi ${escapeHtml(firstName(p.landlordName))},<br>${escapeHtml(p.tenantName)} has cancelled their request to view <strong>${escapeHtml(p.propertyTitle)}</strong> on ${escapeHtml(when(p.date, p.time))}. No action is needed.`,
      cta: { label: "Open my dashboard", url: p.dashboardUrl },
    }),
    text: [
      `Hi ${firstName(p.landlordName)},`,
      ``,
      `${p.tenantName} has cancelled their request to view "${p.propertyTitle}" on ${when(p.date, p.time)}. No action is needed.`,
      ``,
      `Your dashboard: ${p.dashboardUrl}`,
    ].join("\n"),
  };
}

export function passwordResetEmail(p: { name: string; resetUrl: string; minutes: number }): Rendered {
  const subject = "Reset your Efie Homes password";
  return {
    subject,
    html: layout({
      preheader: `This link works once and expires in ${p.minutes} minutes.`,
      heading: "Reset your password",
      body: `Hi ${escapeHtml(firstName(p.name))},<br>Someone (hopefully you) asked to reset the password for your Efie Homes account. The link below works once and expires in ${p.minutes} minutes.`,
      cta: { label: "Choose a new password", url: p.resetUrl },
      footer: "If you didn't ask for this, you can ignore this email. Your password won't change.",
    }),
    text: [
      `Hi ${firstName(p.name)},`,
      ``,
      `Someone (hopefully you) asked to reset the password for your Efie Homes account.`,
      `Choose a new password here (works once, expires in ${p.minutes} minutes):`,
      p.resetUrl,
      ``,
      `If you didn't ask for this, you can ignore this email. Your password won't change.`,
    ].join("\n"),
  };
}

export function newMessageEmail(p: {
  recipientName: string;
  senderName: string;
  propertyTitle: string;
  body: string;
  threadUrl: string;
}): Rendered {
  const subject = `New message from ${p.senderName}: ${p.propertyTitle}`;
  return {
    subject,
    html: layout({
      preheader: p.body.slice(0, 90),
      heading: `${p.senderName} sent you a message`,
      body: `Hi ${escapeHtml(firstName(p.recipientName))},<br>About <strong>${escapeHtml(p.propertyTitle)}</strong>:${quote(p.body)}`,
      cta: { label: "Reply on Efie Homes", url: p.threadUrl },
      footer: "Replies to this email aren't delivered. Please reply on Efie Homes so the conversation stays in one place.",
    }),
    text: [
      `Hi ${firstName(p.recipientName)},`,
      ``,
      `${p.senderName} sent you a message about "${p.propertyTitle}":`,
      ``,
      p.body,
      ``,
      `Reply on Efie Homes: ${p.threadUrl}`,
    ].join("\n"),
  };
}
