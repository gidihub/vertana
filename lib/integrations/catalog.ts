export type IntegrationCategory = "ats" | "automation"

export interface IntegrationField {
  key: string
  label: string
  placeholder?: string
  type?: "text" | "password"
}

export interface IntegrationProvider {
  id: string
  name: string
  description: string
  category: IntegrationCategory
  /** Credential fields collected when connecting. */
  fields: IntegrationField[]
  docsUrl?: string
  /** Brand domain, used to render the provider's logo. */
  domain?: string
}

export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, string> = {
  ats: "Applicant tracking",
  automation: "Automation",
}

// Ordered roughly by adoption/popularity within each category.
export const INTEGRATIONS: IntegrationProvider[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    description: "Sync assessment results into your Greenhouse pipeline.",
    category: "ats",
    fields: [{ key: "apiKey", label: "Harvest API key", type: "password" }],
    docsUrl: "https://developers.greenhouse.io",
    domain: "greenhouse.io",
  },
  {
    id: "lever",
    name: "Lever",
    description: "Push candidate scores and dispositions to Lever.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://hire.lever.co/developer/documentation",
    domain: "lever.co",
  },
  {
    id: "workable",
    name: "Workable",
    description: "Send results back to your Workable jobs.",
    category: "ats",
    fields: [
      { key: "subdomain", label: "Account subdomain", placeholder: "acme" },
      { key: "apiKey", label: "API access token", type: "password" },
    ],
    docsUrl: "https://workable.readme.io/reference",
    domain: "workable.com",
  },
  {
    id: "ashby",
    name: "Ashby",
    description: "Surface Vertana scores inside Ashby.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://developers.ashbyhq.com",
    domain: "ashbyhq.com",
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    description: "Sync assessment results into BambooHR ATS.",
    category: "ats",
    fields: [
      { key: "subdomain", label: "Account subdomain", placeholder: "acme" },
      { key: "apiKey", label: "API key", type: "password" },
    ],
    docsUrl: "https://documentation.bamboohr.com",
    domain: "bamboohr.com",
  },
  {
    id: "smartrecruiters",
    name: "SmartRecruiters",
    description: "Attach assessment outcomes to SmartRecruiters candidates.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://developers.smartrecruiters.com/docs",
    domain: "smartrecruiters.com",
  },
  {
    id: "jazzhr",
    name: "JazzHR",
    description: "Attach assessment outcomes to JazzHR candidates.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://apidoc.jazzhrapis.com",
    domain: "jazzhr.com",
  },
  {
    id: "teamtailor",
    name: "Teamtailor",
    description: "Surface Vertana scores inside Teamtailor.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://docs.teamtailor.com",
    domain: "teamtailor.com",
  },
  {
    id: "zoho-recruit",
    name: "Zoho Recruit",
    description: "Sync assessment results into Zoho Recruit candidates.",
    category: "ats",
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", type: "password" },
    ],
    docsUrl: "https://www.zoho.com/recruit/developer-guide/",
    domain: "zoho.com",
  },
  {
    id: "icims",
    name: "iCIMS",
    description: "Attach assessment outcomes to iCIMS candidates.",
    category: "ats",
    fields: [
      { key: "customerId", label: "Customer ID" },
      { key: "apiKey", label: "API key", type: "password" },
    ],
    docsUrl: "https://developer-community.icims.com",
    domain: "icims.com",
  },
  {
    id: "bullhorn",
    name: "Bullhorn",
    description: "Push candidate scores and dispositions to Bullhorn.",
    category: "ats",
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", type: "password" },
    ],
    docsUrl: "https://bullhorn.github.io/rest-api-docs/",
    domain: "bullhorn.com",
  },
  {
    id: "jobvite",
    name: "Jobvite",
    description: "Sync assessment results into your Jobvite pipeline.",
    category: "ats",
    fields: [
      { key: "apiKey", label: "API key", type: "password" },
      { key: "secret", label: "API secret", type: "password" },
    ],
    docsUrl: "https://help.jobvite.com/s/article/Jobvite-API",
    domain: "jobvite.com",
  },
  {
    id: "jobadder",
    name: "JobAdder",
    description: "Send results back to your JobAdder jobs.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://api.jobadder.com/v2/docs",
    domain: "jobadder.com",
  },
  {
    id: "manatal",
    name: "Manatal",
    description: "Push candidate scores and dispositions to Manatal.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://developers.manatal.com/reference",
    domain: "manatal.com",
  },
  {
    id: "recruitee",
    name: "Recruitee",
    description: "Attach assessment outcomes to Recruitee candidates.",
    category: "ats",
    fields: [
      { key: "companyId", label: "Company ID" },
      { key: "apiKey", label: "API token", type: "password" },
    ],
    docsUrl: "https://docs.recruitee.com",
    domain: "recruitee.com",
  },
  {
    id: "breezy",
    name: "Breezy HR",
    description: "Send results back to your Breezy HR pipelines.",
    category: "ats",
    fields: [{ key: "apiKey", label: "API key", type: "password" }],
    docsUrl: "https://developer.breezy.hr",
    domain: "breezy.hr",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Trigger 6,000+ apps when candidates complete tests.",
    category: "automation",
    fields: [
      {
        key: "webhookUrl",
        label: "Catch hook URL",
        placeholder: "https://hooks.zapier.com/…",
      },
    ],
    docsUrl: "https://platform.zapier.com",
    domain: "zapier.com",
  },
]

export function getIntegration(id: string): IntegrationProvider | undefined {
  return INTEGRATIONS.find((p) => p.id === id)
}

export interface IntegrationStatus {
  provider: string
  status: "connected" | "disabled"
  updatedAt: string
}
