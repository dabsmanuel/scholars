export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear?: number;
  endYear?: number;
  gpa?: string;
  notes?: string;
}

export interface ExperienceEntry {
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface CVData {
  rawText: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  volunteerExperience: ExperienceEntry[];
  skills: string[];
  certifications: string[];
  languages: string[];
  parsedAt: string;
  sourceFileName: string;
}

export interface SavedOpportunity {
  opportunity: string;
  savedAt: string;
  status: "interested" | "in_progress" | "submitted" | "awarded" | "rejected" | "withdrawn";
  personalDeadlineReminder?: string;
  notes?: string;
}

export interface Subscription {
  plan: "free" | "pro";
  status: "active" | "past_due" | "canceled" | "trialing";
  gateway?: "stripe" | "paystack";
  currentPeriodEnd?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  country: string;
  targetFields: string[];
  cvData?: CVData;
  savedOpportunities: SavedOpportunity[];
  subscription: Subscription;
  coachingUsed: number;
  isAdmin: boolean;
}

export type OpportunityType = "scholarship" | "study_program" | "immigration_pathway" | "incubator" | "fellowship";
export type DegreeLevel = "undergraduate" | "masters" | "phd" | "postdoc" | "professional" | "none";

export interface Requirement {
  label: string;
  category: "academic" | "language" | "experience" | "citizenship" | "financial" | "other";
  isHard: boolean;
  detail?: string;
}

export interface Opportunity {
  _id: string;
  title: string;
  provider: string;
  type: OpportunityType;
  country: string;
  region?: string;
  fieldsOfStudy: string[];
  degreeLevel: DegreeLevel;
  deadline?: string;
  applicationOpens?: string;
  fundingCoverage?: string;
  objectives: string;
  eligibilitySummary: string;
  requirements: Requirement[];
  strongApplicantProfile?: string;
  officialUrl: string;
  isActive: boolean;
}

export interface CompetitivePosition {
  tier: "strong" | "competitive" | "borderline" | "longshot";
  standoutFactors: string[];
  gapFromWinner: string;
}

export interface CoachingOutput {
  scholarshipObjectives: string;
  backgroundAlignment: string;
  essayStrategy: string;
  weaknesses: { gap: string; mitigation: string }[];
  requirementBreakdown: { requirementLabel: string; guidance: string }[];
  timeline: { milestone: string; targetDate?: string; deliverable: string }[];
  applicationGuide: string;
  competitivePosition?: CompetitivePosition;
  generatedAt: string;
  modelVersion: string;
  cvParsedAt?: string;
}

export interface RecommendationMatch {
  opportunityId: string;
  fitScore: number;
  fitTier: "strong" | "good" | "moderate" | "weak";
  reasoning: string;
  standoutFactor: string;
  urgency?: string;
  opportunity: Opportunity;
}

export interface EssayDraft {
  _id: string;
  title: string;
  content: string;
  version: number;
  submittedAt: string;
  feedback?: {
    overallAssessment: string;
    strengths: string[];
    issues: { location: string; problem: string; suggestion: string }[];
    authenticityNotes: string;
    reviewedAt: string;
  };
}

export interface Application {
  _id: string;
  user: string;
  opportunity: Opportunity | string;
  targetApplications: { program?: string; school?: string }[];
  coaching?: CoachingOutput;
  essayDrafts: EssayDraft[];
  status: "draft" | "coaching_generated" | "in_review" | "submitted" | "outcome_recorded";
  outcome?: "pending" | "awarded" | "rejected" | "waitlisted";
}
