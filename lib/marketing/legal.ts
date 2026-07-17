export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalDoc {
  slug: string
  title: string
  summary: string
  updated: string
  sections: LegalSection[]
}

// Note: this is illustrative product copy for a demo, not legal advice. Replace
// with counsel-reviewed policies before production use.
export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy policy",
    summary:
      "How Vertana collects, uses, and protects personal information from recruiters and candidates.",
    updated: "July 17, 2026",
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          'Vertana, Inc. ("Vertana", "we", "us", "our") is committed to protecting and respecting your privacy. This privacy policy, and any documents referred to in it, sets out the basis on which we collect and process your personal data when you use our website and our hiring-assessment platform.',
          'By visiting vertana.io (the "Site") or using our services or apps (the "Services") — whether as a member of a hiring team or as a candidate taking an assessment — you accept the practices described in this policy. Please read it carefully to understand our views and practices regarding your personal data and how we treat it.',
          "Please note: this policy does not apply to data we process on behalf of a hiring organization as their data processor. Where a hiring team uses Vertana to assess candidates, that organization is the controller of the candidate data and this policy describes how we handle data as their processor only in that context. The organization's own privacy notice governs its collection and use of candidate data.",
        ],
      },
      {
        heading: "Data controller and our role",
        paragraphs: [
          "For the purposes of the EU General Data Protection Regulation (GDPR), the UK GDPR, and other applicable data protection laws (together, \"Data Protection Law\"), Vertana, Inc. is the data controller for personal data we collect about visitors to our Site and members of hiring teams who register for and administer accounts.",
          "For personal data submitted by candidates during an assessment — such as answers, scores, timing, and any proctoring media — the hiring organization that created the assessment is the controller and Vertana acts as their processor, handling that data on their documented instructions. Our processor terms are set out in our Data Processing Agreement.",
        ],
      },
      {
        heading: "Legal basis for processing",
        paragraphs: [
          "We only use your personal data when the law allows us to. We rely on one or more of the following bases, depending on the activity:",
        ],
        bullets: [
          "Performance of a contract — to register and administer accounts, deliver the Services, and process payments.",
          "Legal obligation — to comply with tax, accounting, and other legal requirements.",
          "Legitimate interests — to run, secure, and improve our business and Services, provided your interests and fundamental rights do not override those interests.",
          "Consent — for candidate proctoring, certain marketing, and any purpose where we ask for it in advance. You can withdraw consent at any time.",
        ],
      },
      {
        heading: "Personal data we collect",
        paragraphs: [
          "Personal data means any information from which an individual can be identified. It does not include anonymized or aggregated data. We collect and process the following categories:",
        ],
        bullets: [
          "Identity data — first and last name, and for candidates the name associated with an assessment or certificate.",
          "Contact data — email address, and any billing contact details you provide.",
          "Financial data — payment card and billing information, processed by our payment provider (Stripe); we do not store full card numbers.",
          "Professional data — job title, company name, and role or skill areas relevant to an assessment.",
          "Assessment data — tests, questions, and scoring settings you create, and candidate submissions including answers, code, scores, timing, and dispositions.",
          "Integrity and proctoring data — tab-focus and tab-switch events and, where camera proctoring is enabled and consented to, webcam snapshots and screen recordings, plus the stored consent record (text, version, and IP address).",
          "Technical data — IP address, login and authentication data, browser type and version, operating system, and device information.",
          "Usage data — how you interact with the Site and Services, including pages viewed, feature use, and email open and click events used to build the invite funnel.",
          "Marketing and communications data — your marketing preferences and communication choices.",
        ],
      },
      {
        heading: "Special category data",
        paragraphs: [
          "When a candidate takes a proctored assessment with camera proctoring enabled, webcam snapshots or screen recordings may incidentally capture special category data — for example, information that could reveal race or ethnicity, or religious or philosophical beliefs from the candidate's appearance or environment. We only collect and use such data where the candidate has given explicit consent before the assessment begins, and it is used solely for integrity review by the hiring organization.",
        ],
      },
      {
        heading: "If you fail to provide personal data",
        paragraphs: [
          "Where we need to collect personal data by law or under a contract with you and you do not provide it when requested, we may be unable to perform that contract — for example, to provide access to the Services. We will notify you if this is the case.",
        ],
      },
      {
        heading: "How personal data is collected",
        paragraphs: [
          "We collect data in the following ways:",
        ],
        bullets: [
          "Direct interactions — when you register an account, create tests, invite candidates, contact support, or otherwise correspond with us.",
          "Candidate assessments — when a candidate follows an assessment link and provides an email address, answers, and (where enabled and consented) proctoring media. Candidates access assessments by token link and are not required to create an account.",
          "Camera and screen captures from proctored tests — where camera proctoring is enabled and the candidate consents, periodic webcam snapshots and, on eligible plans, screen recordings are captured for integrity review. This media is automatically deleted after the retention window configured by the hiring organization (90 days by default).",
          "Automated technologies — as you use the Site and Services we collect technical and usage data using cookies, server logs, and email tracking pixels. See the cookies section below.",
          "Third-party sign-in — where you choose to sign in with Google, we receive basic profile information from that provider to authenticate you.",
        ],
      },
      {
        heading: "Cookies and similar technologies",
        paragraphs: [
          "We use cookies and similar technologies to distinguish you from other users, keep you signed in, remember your preferences, and understand how the Services are used. The categories we use are:",
          "You can set your browser to refuse some or all cookies, but parts of the Site or Services may not function correctly as a result. We do not respond to browser \"Do Not Track\" signals.",
        ],
        bullets: [
          "Strictly necessary — authentication and session cookies that keep you signed in and protect against cross-site request forgery. These are required for the Services to work.",
          "Functionality and preferences — remember choices such as filters and dismissed onboarding prompts, stored in your browser's local or session storage.",
          "Analytics and performance — help us understand usage, diagnose errors, and improve the Services.",
        ],
      },
      {
        heading: "How we use personal data",
        paragraphs: [
          "We use personal data to register and administer accounts; deliver assessments and score and rank submissions; surface integrity signals and provide reporting to the hiring team that created a test; process payments and manage billing; provide support and communicate with you; secure and improve the Services; and comply with our legal obligations.",
          "We will not sell or rent your personal data. We only use it for the purposes for which it was collected, unless we reasonably consider another purpose is compatible with the original one, or where the law requires or permits it.",
        ],
      },
      {
        heading: "Sharing and disclosure",
        paragraphs: [
          "We share personal data with service providers who process it on our behalf under contract, and with others where the law allows. This includes:",
        ],
        bullets: [
          "Hosting, database, authentication, and file storage providers that run the platform.",
          "Email delivery providers used to send invitations, reminders, and account communications.",
          "Payment and billing providers that process subscriptions, credits, and invoices.",
          "AI and code-execution providers used to generate questions and run and grade candidate code.",
          "Professional advisors, and tax or other authorities, where required by law.",
          "A buyer or successor, if we sell or transfer all or part of our business or assets, in which case data held about you may be one of the transferred assets.",
        ],
      },
      {
        heading: "Subprocessors",
        paragraphs: [
          "We engage a limited set of subprocessors to provide the Services, including Supabase (hosting, database, authentication, and storage), Vercel (application hosting and scheduled jobs), Brevo (transactional email), Stripe (payments and billing), OpenAI (AI question generation), and Judge0 (code execution). Each is bound by contract to process data only as needed to provide their service. A current list is available to Custom-tier customers on request as part of our Data Processing Agreement.",
        ],
      },
      {
        heading: "International transfers",
        paragraphs: [
          "Our Services are global, and your personal data may be stored and processed in countries outside your country of residence, including outside the European Economic Area, the UK, and Switzerland, where data protection rules may differ.",
          "Where we transfer personal data across borders, we take steps reasonably necessary to ensure it is treated securely and in line with this policy — for example by transferring to a country recognized as providing adequate protection, or by relying on Standard Contractual Clauses or other approved safeguards.",
        ],
      },
      {
        heading: "Data security",
        paragraphs: [
          "We maintain administrative and technical safeguards appropriate to the risk. Data is stored on secure infrastructure, transmissions are encrypted using TLS, and we support multi-factor authentication for accounts. We limit access to personal data to those who need it to provide the Services, and they are subject to a duty of confidentiality.",
          "We have procedures to deal with any suspected personal data breach and will notify you and any applicable regulator where we are legally required to do so. No transmission over the internet is completely secure, so any transmission is at your own risk.",
        ],
      },
      {
        heading: "Candidate consent and proctoring",
        paragraphs: [
          "Proctoring is optional and always disclosed up front. Before a proctored assessment begins, candidates see exactly what will be monitored — tab and focus activity, and, where enabled, webcam snapshots and screen recording — and must agree to proceed. The consent copy is versioned, and a snapshot of the text, version, and IP address is stored with each attempt.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Subject to Data Protection Law, and free of charge, you have the right to request:",
          "Where Vertana acts as a processor for candidate data, we will refer requests to the relevant hiring organization (the controller) or assist them in responding. We will respond to requests within the timeframes required by law, though complex requests may take longer, in which case we will keep you updated.",
        ],
        bullets: [
          "Access to your personal data.",
          "Rectification of inaccurate data.",
          "Erasure of your data.",
          "Restriction of, or objection to, certain processing.",
          "A portable copy of your data in a structured, machine-readable format.",
          "Withdrawal of consent at any time, where processing is based on consent.",
        ],
      },
      {
        heading: "Marketing communications",
        paragraphs: [
          "We may use your identity, contact, technical, usage, and profile data to decide which products, services, and offers may be relevant to you. We will send you marketing emails only where you have opted in or where you have purchased from us and have not opted out. We will obtain your express opt-in consent before sharing your data with any third party for their marketing.",
          'You can opt out of marketing at any time using the "unsubscribe" link in any marketing email. We will still send you service-related messages about billing, security, and support.',
        ],
      },
      {
        heading: "Data retention",
        paragraphs: [
          "We retain personal data for as long as reasonably necessary to fulfil the purposes for which it was collected, including to satisfy legal, tax, accounting, or reporting requirements, and to resolve disputes or enforce our agreements.",
          "Proctoring media is retained for the window configured by the hiring organization (90 days by default) and is then automatically deleted. Assessment data is retained while the associated account remains active or as needed to provide reporting; hiring teams can delete tests and results, and candidates can request removal of their submissions and self-remove any public certificate. We may keep anonymized information indefinitely for research and statistical purposes.",
        ],
      },
      {
        heading: "Age of users",
        paragraphs: [
          "The Site and Services are not intended for and must not be used by anyone under the age of 16.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "Any changes we make will be posted on this page and, where appropriate, notified to you within the Services or by email. This policy is effective from the date shown above and replaces any previously applicable version. Please check back regularly for updates.",
        ],
      },
      {
        heading: "Complaints and contact",
        paragraphs: [
          "If you have any concerns about how we handle your personal data, we encourage you to contact us first so we can address them. You also have the right to lodge a complaint with your local data protection supervisory authority.",
          "Questions, comments, and requests regarding this policy can be sent to privacy@vertana.io. To exercise your data protection rights specifically, you can also contact gdpr@vertana.io.",
        ],
      },
    ],
  },
  {
    slug: "gdpr",
    title: "GDPR compliance",
    summary:
      "How Vertana supports the rights of individuals in the EU and EEA under the GDPR.",
    updated: "June 1, 2026",
    sections: [
      {
        heading: "Our commitment",
        paragraphs: [
          "Vertana is built to help hiring teams assess candidates fairly while respecting data protection rights. We support compliance with the EU General Data Protection Regulation (GDPR) for candidates and hiring teams in the EU and EEA.",
        ],
      },
      {
        heading: "Roles",
        paragraphs: [
          "For candidate assessment data, the hiring organization is the data controller and Vertana acts as a data processor, handling information on their instructions.",
        ],
      },
      {
        heading: "Lawful basis",
        paragraphs: [
          "We process assessment data on the basis of the hiring organization's legitimate interest in evaluating candidates, and on candidate consent where proctoring is enabled.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Individuals in the EU and EEA have rights over their personal data.",
        ],
        bullets: [
          "Access the personal data we hold about you.",
          "Request correction of inaccurate data.",
          "Request erasure of your data.",
          "Object to or restrict certain processing.",
          "Request a portable copy of your data.",
        ],
      },
      {
        heading: "Data transfers",
        paragraphs: [
          "Where data is transferred outside the EEA, we rely on appropriate safeguards such as Standard Contractual Clauses.",
        ],
      },
      {
        heading: "Exercising your rights",
        paragraphs: [
          "To exercise any of these rights, contact gdpr@vertana.io. We will respond within the timeframes required by law.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of use",
    summary:
      "The terms that govern your use of the Vertana website and assessment platform.",
    updated: "July 17, 2026",
    sections: [
      {
        heading: "Acceptance of terms",
        paragraphs: [
          'This website and platform are provided by Vertana, Inc. ("Vertana", "we", "us", "our"). By using our website (the "Site") and the services offered on it (the "Services"), you agree to be legally bound by these terms of use ("Terms of Use"), as they may be modified and posted here from time to time. If you do not wish to be bound by these Terms of Use, you may not use the Site or Services.',
          "If you are using Vertana on behalf of an organization, you agree to these Terms of Use on that organization's behalf. Where you sign up for a paid plan or any Services for which we charge fees, additional order terms or a subscription agreement will also apply to your use of those Services.",
        ],
      },
      {
        heading: "Privacy policy",
        paragraphs: [
          "We are committed to protecting your privacy. Please read our Privacy Policy carefully — by using the Site and Services you confirm that you agree with it. All data you provide when using the Site and Services is handled as described in that policy.",
        ],
      },
      {
        heading: "Use of the service",
        paragraphs: [
          "You may use Vertana to create assessments, invite candidates, review results, and manage your hiring team. You are responsible for the content of the assessments you create and for using the platform in a lawful, fair, and non-discriminatory manner.",
        ],
      },
      {
        heading: "Candidate assessments",
        paragraphs: [
          "You agree to disclose proctoring to candidates and to obtain consent where required, and not to use assessment data for any purpose other than evaluating candidates for the role in question. Where Vertana processes candidate data on your behalf, you act as the data controller and we act as your processor, as set out in our Data Processing Agreement.",
        ],
      },
      {
        heading: "Service availability",
        paragraphs: [
          'The Site and the Services are provided on an "as is" basis, and we cannot be liable if, for any reason, they are unavailable for any period of time. We work to keep Vertana available and reliable, but access may be suspended at any time, and we do not warrant uninterrupted availability.',
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "You agree not to misuse the platform.",
        ],
        bullets: [
          "Do not attempt to disrupt, probe, or reverse engineer the Services.",
          "Do not upload unlawful, infringing, offensive, misleading, or harmful content, or anything containing malware.",
          "Do not use the platform to discriminate against protected groups.",
          "Do not publish, distribute, extract, re-utilise, or reproduce any part of the Site or Services except as permitted by these terms or with our written permission.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "The Site and Services contain data and information protected by trademark, patent, copyright, and database rights. No part of the Site or Services may be published, distributed, extracted, re-utilised, or reproduced in any material form except with our separate written permission or as permitted by applicable law. We reserve the right, at our discretion, to withdraw or modify the licences we grant to use our content at any time.",
        ],
      },
      {
        heading: "Data provided by you",
        paragraphs: [
          "You agree that all data you send or upload to the Site or Services — including emails, text, and responses to any information available through the Services — is lawful, truthful, decent, and not offensive; complies with all applicable laws and regulations; does not infringe the intellectual property or other rights of us or any third party; is not defamatory or misleading; and is free from malware.",
          "You are solely responsible for your data. If we consider that any part of it exposes us to the risk of a claim or complaint, we may block access to all or part of the Services and remove all or part of that data, and you must provide reasonable assistance in doing so. All data you provide is treated as set out in our Privacy Policy.",
        ],
      },
      {
        heading: "Ownership of candidate answers",
        paragraphs: [
          'On completing an assessment and submitting answers and solutions, the candidate assigns all rights, title, and interest in, and the copyright to, those answers and solutions to the owner of the testing content (the "Owner") for its exclusive use, so that the Owner is the sole and exclusive owner of the copyright and other intellectual property rights in such answers and solutions. Answers and solutions may not be reproduced or republished in any medium without the Owner\'s express written permission.',
        ],
      },
      {
        heading: "Links to other websites",
        paragraphs: [
          "The Site and Services may offer links to other websites and services. We are not responsible for the content of any linked website or any transmission received from it. Such links do not imply that we endorse or have approved the linked website or service. The terms of use and privacy policies of linked websites may differ from ours, and we encourage you to review them before submitting any personal data.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "We do not accept liability for the accuracy, completeness, or suitability for a particular purpose of any content published or made available on or through the Site or Services, unless liability cannot be limited under applicable law. We will not be liable for any damages arising in contract, tort, or otherwise from the use of, or inability to use, the Site, the Services, or any linked website, or from any action or decision taken as a result of using them.",
        ],
      },
      {
        heading: "Governing law and jurisdiction",
        paragraphs: [
          "Your use of the Site and Services is governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict-of-laws rules. Any dispute arising out of your use of the Site or Services shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware.",
        ],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "These Terms of Use may change from time to time, so you should review them regularly. We will notify you of changes where we are required to do so. These Terms of Use are effective from the date shown above and replace all previously applicable versions.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about these terms can be sent to legal@vertana.io.",
        ],
      },
    ],
  },
  {
    slug: "dpa",
    title: "Data processing agreement",
    summary:
      "Processor terms for hiring teams using Vertana to evaluate candidates (Custom tier).",
    updated: "July 12, 2026",
    sections: [
      {
        heading: "Scope",
        paragraphs: [
          "This Data Processing Agreement (DPA) applies when your organization engages Vertana to process candidate personal data on your behalf. You remain the controller; Vertana acts as processor for assessment delivery, scoring, and integrity signals.",
        ],
      },
      {
        heading: "Processing instructions",
        paragraphs: [
          "Vertana processes candidate data only to provide the assessment services you configure — including invitations, submissions, results, and optional integrity monitoring with consent.",
        ],
        bullets: [
          "No sale of candidate personal data.",
          "Subprocessors limited to infrastructure required to run the service (e.g. hosting, database, email).",
          "Deletion or export available on request for Custom customers.",
        ],
      },
      {
        heading: "Security & retention",
        paragraphs: [
          "We maintain administrative and technical safeguards appropriate to the risk. Retention defaults follow your configured assessment settings and published privacy schedules unless a custom retention window is agreed in writing.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "To execute a DPA for your organization, contact legal@vertana.io with your company name, billing contact, and desired retention terms.",
        ],
      },
    ],
  },
]

export function getLegalDoc(slug: string) {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
