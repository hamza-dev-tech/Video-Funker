/**
 * Starting points for the three ICP fields nobody can fill in cold.
 *
 * Industry, company size, region and tone are dropdowns — you pick from a list
 * and move on. Roles, pain points and buying triggers were empty boxes with a
 * single example in the placeholder, and they are the three fields that decide
 * what every video actually says.
 *
 * Enumerating the buying triggers of a mid-market healthcare buyer is B2B
 * demand-gen expertise. Our customer hired us so they would not have to be good
 * at that, and then we asked them to be good at it anyway. Same failure the
 * avatar flow had with prompt writing, and the same fix: named options they can
 * click, adjust and add to.
 *
 * Keyed on the industry values in ICPForm's INDUSTRY_OPTIONS. Anything without
 * a specific entry falls back to GENERAL, which is written to be true of any
 * B2B buyer rather than vaguely true of none.
 */

export interface FieldSuggestions {
  roles: string[];
  painPoints: string[];
  buyingTriggers: string[];
}

const GENERAL: FieldSuggestions = {
  roles: ["CEO / Founder", "VP of Sales", "Head of Marketing", "Operations Director", "CTO"],
  painPoints: [
    "Growth has stalled and nobody agrees why",
    "Too much manual work in the team",
    "Cannot prove what marketing is returning",
    "Losing deals to a cheaper competitor",
    "Onboarding new customers takes too long",
  ],
  buyingTriggers: [
    "Raised a new funding round",
    "Hired a new leader for this function",
    "Missed a quarterly target",
    "Announced expansion into a new market",
    "Started hiring for roles that signal this problem",
  ],
};

const BY_INDUSTRY: Record<string, FieldSuggestions> = {
  "Technology / SaaS": {
    roles: ["VP of Sales", "Head of RevOps", "Head of Growth", "CTO", "VP of Customer Success"],
    painPoints: [
      "Pipeline is not keeping pace with the target",
      "Sales cycles are getting longer",
      "Reps ramp too slowly to hit quota",
      "Churn is rising in a segment nobody owns",
      "Outbound reply rates have collapsed",
    ],
    buyingTriggers: [
      "Raised a Series A or B",
      "Hired a new VP of Sales or CRO",
      "Doubled headcount in go-to-market",
      "Launched a second product line",
      "Moved upmarket to enterprise deals",
    ],
  },
  Healthcare: {
    roles: ["Chief Medical Officer", "Head of Operations", "Practice Manager", "Director of Nursing", "Head of Compliance"],
    painPoints: [
      "Staff spend more time on admin than on patients",
      "Compliance reporting eats a week every month",
      "Patient wait times are damaging referrals",
      "Systems do not talk to each other",
      "Clinician burnout is driving turnover",
    ],
    buyingTriggers: [
      "New regulation takes effect",
      "Opened an additional site",
      "Failed or narrowly passed an audit",
      "Replacing an ageing records system",
      "Merged with another practice or group",
    ],
  },
  "Financial Services": {
    roles: ["Head of Compliance", "Chief Risk Officer", "Head of Operations", "Director of Wealth Management", "CFO"],
    painPoints: [
      "Manual reporting cannot keep up with regulation",
      "Client onboarding takes weeks",
      "Legacy systems block anything new",
      "Advisers spend more time on admin than clients",
      "Risk data is scattered across teams",
    ],
    buyingTriggers: [
      "New regulatory deadline announced",
      "Acquired another firm",
      "Appointed a new compliance lead",
      "Failed an internal audit",
      "Launching a new product or fund",
    ],
  },
  Manufacturing: {
    roles: ["Plant Manager", "Head of Supply Chain", "Operations Director", "Head of Quality", "COO"],
    painPoints: [
      "Unplanned downtime is eating margin",
      "Supply chain visibility ends at the first tier",
      "Quality issues are found too late",
      "Skilled staff are retiring faster than they are replaced",
      "Planning still runs on spreadsheets",
    ],
    buyingTriggers: [
      "Opened or retooled a line",
      "Lost a major customer to quality issues",
      "Supply chain disruption in a key input",
      "New efficiency or sustainability mandate",
      "Capital budget approved for the year",
    ],
  },
  "Retail / E-commerce": {
    roles: ["Head of E-commerce", "Head of Marketing", "Merchandising Director", "Head of Customer Experience", "COO"],
    painPoints: [
      "Customer acquisition cost keeps climbing",
      "Repeat purchase rate is falling",
      "Inventory is wrong in both directions",
      "Channels each report different numbers",
      "Returns are quietly destroying margin",
    ],
    buyingTriggers: [
      "Launched a new channel or marketplace",
      "Approaching a peak trading season",
      "Replatformed the storefront",
      "Opened in a new country",
      "Brought fulfilment in-house",
    ],
  },
  "Professional Services": {
    roles: ["Managing Partner", "Head of Business Development", "Practice Lead", "Head of Delivery", "Operations Director"],
    painPoints: [
      "Growth depends entirely on referrals",
      "Utilisation is uneven across the team",
      "Proposals take too long to produce",
      "Expertise sits with two or three people",
      "Pricing is inconsistent between clients",
    ],
    buyingTriggers: [
      "Won a client larger than anything before",
      "Opened a new practice area",
      "Hired a first dedicated sales lead",
      "Lost a founding partner",
      "Set a target to reduce referral dependence",
    ],
  },
  Education: {
    roles: ["Head of Admissions", "Director of Marketing", "Dean", "Head of Student Services", "COO"],
    painPoints: [
      "Enrolment is falling year over year",
      "Applicants drop out mid-funnel",
      "Staff time goes to admin, not students",
      "Systems do not share a single student record",
      "Hard to prove programme outcomes",
    ],
    buyingTriggers: [
      "Approaching an admissions cycle",
      "Launched a new programme",
      "New accreditation requirement",
      "Budget approved for student systems",
      "Appointed new leadership",
    ],
  },
  "Real Estate": {
    roles: ["Head of Sales", "Property Manager", "Head of Leasing", "Managing Director", "Head of Marketing"],
    painPoints: [
      "Leads go cold before anyone follows up",
      "Listings take too long to move",
      "Tenant turnover is expensive",
      "Reporting to owners is manual",
      "No consistent pipeline between agents",
    ],
    buyingTriggers: [
      "Took on a new portfolio",
      "Opened a new office or region",
      "Interest rate shift changing demand",
      "Hired additional agents",
      "Renewing a property management system",
    ],
  },
  "Media / Entertainment": {
    roles: ["Head of Content", "Head of Partnerships", "Audience Development Lead", "Commercial Director", "CMO"],
    painPoints: [
      "Audience growth has plateaued",
      "Ad revenue per user is falling",
      "Production costs outpace returns",
      "No clear view of what content performs",
      "Distribution depends on one platform",
    ],
    buyingTriggers: [
      "Launched a new show, title or format",
      "Platform algorithm change hit reach",
      "Signed a distribution deal",
      "Moving to a subscription model",
      "New commercial leadership appointed",
    ],
  },
};

export function suggestionsFor(industry?: string | null): FieldSuggestions {
  if (!industry) return GENERAL;
  return BY_INDUSTRY[industry] ?? GENERAL;
}

/** True when we have industry-specific ideas rather than the general set. */
export function isIndustrySpecific(industry?: string | null): boolean {
  return !!industry && industry in BY_INDUSTRY;
}
