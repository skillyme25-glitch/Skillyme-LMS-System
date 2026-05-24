export type Role = 'SUPER_ADMIN' | 'FACILITATOR' | 'MENTOR' | 'MEMBER';
export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WAITLISTED';
export type ApplyingAs = 'INDIVIDUAL' | 'PRE_FORMED_TEAM' | 'HARDSHIP';
export type PricingTier = 'INDIVIDUAL' | 'GROUP' | 'HARDSHIP';
export type UserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';
export type StageGroup = 'IDEA_STAGE' | 'EARLY_BUILDER' | 'EARLY_TRACTION';
export type FunctionalRole = 'BUILDER' | 'COMMERCIAL' | 'GROWTH' | 'PRODUCT' | 'DOMAIN_EXPERT' | 'DESIGN' | 'LEGAL';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'FLAGGED';
export type EventType = 'SESSION' | 'MILESTONE_DEADLINE' | 'TEAM_EVENT' | 'PROGRAM_EVENT';
export type TargetAudience = 'ALL' | 'SPECIFIC_TEAM';
export type NotificationType = 'ANNOUNCEMENT' | 'MILESTONE_REMINDER' | 'MILESTONE_APPROVED' | 'MILESTONE_FLAGGED' | 'SESSION_REMINDER' | 'TEAM_UPDATE' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  photoUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  teamMemberships?: TeamMember[];
  mentorAssignments?: MentorTeam[];
}

export interface Team {
  id: string;
  name: string;
  productName?: string;
  productDescription?: string;
  sector?: string;
  stageGroup: StageGroup;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  mentors?: MentorTeam[];
  milestones?: TeamMilestone[];
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  functionalRole: FunctionalRole;
  isTeamLead: boolean;
  joinedAt: string;
  user?: User;
  team?: Team;
}

export interface MentorTeam {
  id: string;
  mentorId: string;
  teamId: string;
  assignedAt: string;
  mentor?: User;
  team?: Team;
}

export interface Milestone {
  id: string;
  weekNumber: number;
  stageGroup: StageGroup;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMilestone {
  id: string;
  teamId: string;
  milestoneId: string;
  status: MilestoneStatus;
  submissionNote?: string;
  answers?: Record<string, string> | null;
  facilitatorNote?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  milestone?: Milestone;
  reviewedBy?: { firstName: string; lastName: string };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: EventType;
  isAllTeams: boolean;
  teamId?: string;
  createdById: string;
  googleCalendarLink?: string;
  icsUrl?: string;
  createdAt: string;
  updatedAt: string;
  team?: { name: string };
  createdBy?: { firstName: string; lastName: string };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  postedById: string;
  targetAudience: TargetAudience;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  postedBy?: { firstName: string; lastName: string; photoUrl?: string };
  team?: { name: string };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface TeamPost {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  membership?: { functionalRole: FunctionalRole; isTeamLead: boolean } | null;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string };
}

export interface DashboardStats {
  totalParticipants: number;
  activeParticipants: number;
  invitedPending: number;
  totalTeams: number;
  milestoneProgressByWeek: MilestoneWeekProgress[];
  teamsAtRisk: TeamAtRisk[];
  recentActivity: AuditLog[];
}

export interface MilestoneWeekProgress {
  weekNumber: number;
  milestoneTitle: string;
  dueDate: string;
  teamStatuses: Record<MilestoneStatus, number>;
}

export interface TeamAtRisk {
  teamId: string;
  teamName: string;
  flaggedWeeks: number[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  photoUrl?: string;
  teams?: Array<{ teamId: string; teamName: string; functionalRole: FunctionalRole; isTeamLead: boolean }>;
}

export interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  employmentStatus?: string;
  workLink?: string;
  stageGroup: StageGroup;
  applyingAs: ApplyingAs;
  primaryRole: FunctionalRole;
  ideaDescription?: string;
  customerInsight?: string;
  ideaOwnership?: string;
  canCommit?: string;
  sessionPreference?: string[];
  hoursPerWeek?: string;
  commitment?: string;
  teammateInfo?: Array<{ firstName: string; lastName: string; email: string }>;
  hardshipReason?: string;
  referralSource?: string;
  additionalInfo?: string;
  confirmedTerms: boolean;
  status: ApplicationStatus;
  adminScore?: number;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedBy?: { firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages?: number };
}
