import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { CONTACT, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The rules for using Efie Homes as a tenant, landlord or agent.",
  alternates: { canonical: "/terms" },
};


export default function TermsPage() {
  return (
    <ContentPage eyebrow="Legal" title="Terms of use" updated={LEGAL_UPDATED}>
      <p>
        These terms apply when you use Efie Homes (&ldquo;we&rdquo;, &ldquo;us&rdquo;), the website that connects people looking for rental homes in
        Ghana with landlords and agents. By creating an account or using the site you agree to them. If you don&rsquo;t agree, please
        don&rsquo;t use Efie Homes.
      </p>

      <h2>1. What Efie Homes does, and doesn&rsquo;t do</h2>
      <ul>
        <li>We provide a place to list rental homes, search them, request viewings and message each other.</li>
        <li>
          We are <strong>not a party to any tenancy</strong>. Rent, advance, deposits, commissions and tenancy agreements are between the tenant
          and the landlord or agent.
        </li>
        <li>
          We <strong>do not collect or hold any rent, advance or deposit</strong>, and we will never ask you to pay one through us.
        </li>
      </ul>

      <h2>2. Your account</h2>
      <ul>
        <li>Give accurate details, keep your password private, and tell us if you think someone else has used your account.</li>
        <li>You are responsible for what happens under your account. One person per account; you must be at least 18.</li>
        <li>We may suspend or close accounts that break these terms or put other users at risk.</li>
      </ul>

      <h2>3. Landlords and agents</h2>
      <ul>
        <li>Only list homes you own or are authorised to let, and keep each listing accurate and up to date (including when it&rsquo;s rented).</li>
        <li>
          Show the true monthly rent, minimum advance, any agent commission and any deposit. Don&rsquo;t ask tenants for fees that aren&rsquo;t
          shown on the listing.
        </li>
        <li>Use only photos you have the right to use, and that show the actual property.</li>
        <li>Respond honestly to viewing requests and messages, and don&rsquo;t discriminate against tenants unlawfully.</li>
      </ul>

      <h2>4. Tenants</h2>
      <ul>
        <li>Only request viewings you intend to attend, and cancel ones you can&rsquo;t make.</li>
        <li>
          <strong>Always inspect a home in person, and confirm who you are dealing with, before paying any advance, deposit or fee.</strong>
        </li>
      </ul>

      <h2>5. Things you must not do</h2>
      <ul>
        <li>Post false, misleading, duplicate or illegal listings, or listings for homes that aren&rsquo;t available.</li>
        <li>Harass, threaten or scam other users, or ask for payments outside what a listing states.</li>
        <li>Use the site to send spam, collect other users&rsquo; details, or copy listings in bulk.</li>
        <li>Try to break, overload or get around the site&rsquo;s security.</li>
      </ul>

      <h2>6. Content you post</h2>
      <p>
        You keep ownership of the listings, photos and messages you post. You give us permission to show, store and format them to run
        Efie Homes, including in search results and share previews. We may hide, edit for formatting, or remove content that breaks these
        terms or looks unsafe, and we may verify (or remove verification from) landlord accounts at our discretion.
      </p>

      <h2>7. Our responsibility</h2>
      <p>
        We work to keep Efie Homes accurate and safe, but listings are written by landlords and agents and we can&rsquo;t guarantee every detail,
        or that a home is available or as described. The site is provided &ldquo;as is&rdquo;. As far as the law allows, we are not liable for losses
        arising from tenancies, payments or dealings between users. Nothing in these terms limits rights you have under Ghanaian law that
        can&rsquo;t be limited.
      </p>

      <h2>8. Changes and ending</h2>
      <p>
        We may update these terms; the date at the top shows the latest version, and we&rsquo;ll highlight significant changes. You can stop
        using Efie Homes at any time and ask us to close your account (see our <Link href="/privacy">privacy policy</Link>).
      </p>

      <h2>9. Law and contact</h2>
      <p>
        These terms are governed by the laws of the Republic of Ghana. Questions? Contact us at{" "}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or {CONTACT.phoneDisplay}.
      </p>
    </ContentPage>
  );
}
