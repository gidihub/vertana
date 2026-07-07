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
    updated: "June 1, 2026",
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "This policy explains what information Vertana collects when you use our assessment platform, why we collect it, and the choices you have. It applies to both hiring teams who create assessments and candidates who take them.",
        ],
      },
      {
        heading: "Information we collect",
        paragraphs: [
          "We collect only what we need to run assessments and report results.",
        ],
        bullets: [
          "Account details for hiring teams, such as name and email address.",
          "Assessment content you create, including questions and scoring settings.",
          "Candidate submissions, including answers, scores, and timing.",
          "Integrity signals when proctoring is enabled, such as camera verification and focus events — always with the candidate's prior consent.",
        ],
      },
      {
        heading: "How we use information",
        paragraphs: [
          "Information is used to deliver assessments, score and rank submissions, surface integrity signals, and provide reporting to the hiring team that created the test. We do not sell personal information.",
        ],
      },
      {
        heading: "Candidate consent",
        paragraphs: [
          "Proctoring is optional and disclosed up front. Candidates see exactly what will be monitored and must agree before an assessment begins. The consent version is stored with each attempt.",
        ],
      },
      {
        heading: "Data retention",
        paragraphs: [
          "Assessment data is retained for as long as the associated account remains active or as needed to provide reporting. Hiring teams can delete tests and results, and candidates can request removal of their submissions.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about this policy can be sent to privacy@vertana.io.",
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
      "The terms that govern your use of the Vertana assessment platform.",
    updated: "June 1, 2026",
    sections: [
      {
        heading: "Acceptance of terms",
        paragraphs: [
          "By accessing or using Vertana, you agree to these terms. If you are using Vertana on behalf of an organization, you agree to them on that organization's behalf.",
        ],
      },
      {
        heading: "Use of the service",
        paragraphs: [
          "You may use Vertana to create assessments, invite candidates, and review results. You are responsible for the content of the assessments you create and for using the platform in a lawful, non-discriminatory manner.",
        ],
      },
      {
        heading: "Candidate assessments",
        paragraphs: [
          "You agree to disclose proctoring to candidates and to obtain consent where required. You agree not to use assessment data for any purpose other than evaluating candidates for the role in question.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "You agree not to misuse the platform.",
        ],
        bullets: [
          "Do not attempt to disrupt or reverse engineer the service.",
          "Do not upload unlawful, infringing, or harmful content.",
          "Do not use the platform to discriminate against protected groups.",
        ],
      },
      {
        heading: "Availability",
        paragraphs: [
          "We work to keep Vertana available and reliable, but the service is provided on an as-is basis without warranties of uninterrupted availability.",
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
]

export function getLegalDoc(slug: string) {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
