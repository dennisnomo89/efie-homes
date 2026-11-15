import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { CONTACT, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal information Efie Homes collects, why, who sees it, and your rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Legal" title="Privacy policy" updated={LEGAL_UPDATED}>
      <p>
        This policy explains what personal information Efie Homes collects, how we use it, and the choices you have. We handle personal
        data in line with Ghana&rsquo;s <strong>Data Protection Act, 2012 (Act 843)</strong>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, password (stored only in scrambled, hashed form), optional phone number and
          profile photo link, and whether you are a tenant or landlord.
        </li>
        <li>
          <strong>Listings:</strong> for landlords, the property details, photos, rent and terms you enter, and an optional map pin.
        </li>
        <li>
          <strong>Viewing requests and messages:</strong> the date, time, phone number and messages you send, and the replies.
        </li>
        <li>
          <strong>Saved homes and saved searches,</strong> and whether you want email alerts.
        </li>
        <li>
          <strong>Technical data:</strong> basic logs (such as IP address, device and pages requested) used to keep the site secure and limit
          abuse, such as repeated failed logins.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show listings, viewing requests, messages and alerts.</li>
        <li>To send emails you&rsquo;ve asked for or that are part of the service (viewing updates, messages, alerts, password resets).</li>
        <li>To keep Efie Homes safe: preventing fraud and abuse, moderating listings and verifying landlords.</li>
        <li>We do <strong>not</strong> sell your personal information or use it for third-party advertising.</li>
      </ul>

      <h2>Who can see what</h2>
      <ul>
        <li>Listings are public. A map pin is shown only approximately (to within about 100&ndash;300 m), never the exact spot.</li>
        <li>
          When you request a viewing, the landlord of that home sees your name, phone number and message. Once a landlord confirms a viewing,
          you see their phone number.
        </li>
        <li>Messages are visible only to the tenant and landlord in that conversation, and to our administrators for safety reviews.</li>
      </ul>

      <h2>Services we use</h2>
      <p>We use trusted providers to run the site. They process data only to provide their service to us:</p>
      <ul>
        <li>
          <strong>Vercel</strong> (website hosting and photo storage) and <strong>Neon</strong> (database), with servers in the EU.
        </li>
        <li>
          <strong>Resend</strong> (sending emails).
        </li>
        <li>
          <strong>OpenStreetMap</strong> (map images; your browser loads map tiles directly from their servers) and <strong>Unsplash</strong>{" "}
          (some sample photos).
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use a single essential cookie to keep you logged in. We don&rsquo;t use advertising or tracking cookies, so there&rsquo;s nothing to opt
        out of.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account information while your account is open. Listings, messages and viewing requests are removed when the account
        or listing is deleted. Security logs and rate-limit records are kept for a short time (usually days). Emails already delivered to
        someone&rsquo;s inbox can&rsquo;t be recalled.
      </p>

      <h2>Your rights</h2>
      <p>Under Ghanaian law you can ask us to:</p>
      <ul>
        <li>tell you what personal information we hold about you and give you a copy;</li>
        <li>correct inaccurate information (you can also edit most of it yourself in your profile);</li>
        <li>delete your account and personal information, unless we must keep something to meet a legal obligation;</li>
        <li>stop using your information for a particular purpose, such as email alerts (each alert has a one-click unsubscribe link).</li>
      </ul>
      <p>
        To make a request, contact us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or {CONTACT.phoneDisplay}. You can also complain
        to Ghana&rsquo;s Data Protection Commission.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed, connections use HTTPS, sessions can be signed out everywhere from your profile, and repeated login attempts
        are limited. No system is perfectly secure, so please use a strong password you don&rsquo;t use elsewhere.
      </p>

      <h2>Children</h2>
      <p>Efie Homes is for adults. You must be 18 or older to create an account.</p>

      <h2>Changes</h2>
      <p>
        We may update this policy; the date at the top shows the latest version. See also our <Link href="/terms">terms of use</Link>.
      </p>
    </ContentPage>
  );
}
