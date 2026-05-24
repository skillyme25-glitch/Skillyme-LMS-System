import { PrismaClient, Role, UserStatus, StageGroup, FunctionalRole, MilestoneStatus, EventType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Admin user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillyme.africa' },
    update: {},
    create: {
      email: 'admin@skillyme.africa',
      passwordHash,
      firstName: 'Program',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── Facilitator ───────────────────────────────────────────────────────────
  const facilitatorHash = await bcrypt.hash('Facilitator@1234', 12);
  const facilitator = await prisma.user.upsert({
    where: { email: 'facilitator@skillyme.africa' },
    update: {},
    create: {
      email: 'facilitator@skillyme.africa',
      passwordHash: facilitatorHash,
      firstName: 'Lead',
      lastName: 'Facilitator',
      role: Role.FACILITATOR,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Facilitator: ${facilitator.email}`);

  // ─── Teams ─────────────────────────────────────────────────────────────────
  const teamAlpha = await prisma.team.upsert({
    where: { id: 'team-alpha-00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'team-alpha-00000000-0000-0000-0000-000000000001',
      name: 'Team Alpha',
      productName: 'AgriLink',
      productDescription: 'Connecting smallholder farmers to premium buyers via mobile.',
      sector: 'AgriTech',
      stageGroup: StageGroup.IDEA_STAGE,
    },
  });

  const teamBeta = await prisma.team.upsert({
    where: { id: 'team-beta-000000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'team-beta-000000000-0000-0000-0000-000000000002',
      name: 'Team Beta',
      productName: 'MediTrack',
      productDescription: 'Digital health records and appointment scheduling for clinics.',
      sector: 'HealthTech',
      stageGroup: StageGroup.EARLY_BUILDER,
    },
  });

  const teamGamma = await prisma.team.upsert({
    where: { id: 'team-gamma-0000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'team-gamma-0000000-0000-0000-0000-000000000003',
      name: 'Team Gamma',
      productName: 'EduPulse',
      productDescription: 'Gamified professional upskilling for African youth.',
      sector: 'EdTech',
      stageGroup: StageGroup.EARLY_TRACTION,
    },
  });
  console.log('✅ Teams created');

  // ─── Sample members ────────────────────────────────────────────────────────
  const memberPassword = await bcrypt.hash('Member@1234', 12);

  const alphaMembers = [
    { email: 'alice@example.com', firstName: 'Alice', lastName: 'Kamau', role: FunctionalRole.BUILDER, isTeamLead: true },
    { email: 'bob@example.com', firstName: 'Bob', lastName: 'Otieno', role: FunctionalRole.COMMERCIAL, isTeamLead: false },
    { email: 'carol@example.com', firstName: 'Carol', lastName: 'Wanjiku', role: FunctionalRole.DESIGN, isTeamLead: false },
    { email: 'david@example.com', firstName: 'David', lastName: 'Mwangi', role: FunctionalRole.GROWTH, isTeamLead: false },
  ];

  const betaMembers = [
    { email: 'eve@example.com', firstName: 'Eve', lastName: 'Achieng', role: FunctionalRole.PRODUCT, isTeamLead: true },
    { email: 'frank@example.com', firstName: 'Frank', lastName: 'Njoroge', role: FunctionalRole.BUILDER, isTeamLead: false },
    { email: 'grace@example.com', firstName: 'Grace', lastName: 'Omondi', role: FunctionalRole.DOMAIN_EXPERT, isTeamLead: false },
    { email: 'henry@example.com', firstName: 'Henry', lastName: 'Kipchoge', role: FunctionalRole.COMMERCIAL, isTeamLead: false },
  ];

  const gammaMembers = [
    { email: 'irene@example.com', firstName: 'Irene', lastName: 'Mutua', role: FunctionalRole.GROWTH, isTeamLead: true },
    { email: 'james@example.com', firstName: 'James', lastName: 'Oloo', role: FunctionalRole.BUILDER, isTeamLead: false },
    { email: 'karen@example.com', firstName: 'Karen', lastName: 'Githinji', role: FunctionalRole.PRODUCT, isTeamLead: false },
    { email: 'leo@example.com', firstName: 'Leo', lastName: 'Macharia', role: FunctionalRole.DESIGN, isTeamLead: false },
  ];

  type MemberDef = { email: string; firstName: string; lastName: string; role: FunctionalRole; isTeamLead: boolean };
  async function createMembersForTeam(
    members: MemberDef[],
    team: typeof teamAlpha
  ) {
    for (const m of members) {
      const user = await prisma.user.upsert({
        where: { email: m.email },
        update: {},
        create: {
          email: m.email,
          passwordHash: memberPassword,
          firstName: m.firstName,
          lastName: m.lastName,
          role: Role.MEMBER,
          status: UserStatus.ACTIVE,
        },
      });
      await prisma.teamMember.upsert({
        where: { userId_teamId: { userId: user.id, teamId: team.id } },
        update: {},
        create: {
          userId: user.id,
          teamId: team.id,
          functionalRole: m.role,
          isTeamLead: m.isTeamLead,
        },
      });
    }
  }

  await createMembersForTeam(alphaMembers, teamAlpha);
  await createMembersForTeam(betaMembers, teamBeta);
  await createMembersForTeam(gammaMembers, teamGamma);
  console.log('✅ Team members created');

  // ─── Mentor ────────────────────────────────────────────────────────────────
  const mentorHash = await bcrypt.hash('Mentor@1234', 12);
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@skillyme.africa' },
    update: {},
    create: {
      email: 'mentor@skillyme.africa',
      passwordHash: mentorHash,
      firstName: 'Samuel',
      lastName: 'Ndegwa',
      role: Role.MENTOR,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.mentorTeam.upsert({
    where: { mentorId_teamId: { mentorId: mentor.id, teamId: teamAlpha.id } },
    update: {},
    create: { mentorId: mentor.id, teamId: teamAlpha.id },
  });
  await prisma.mentorTeam.upsert({
    where: { mentorId_teamId: { mentorId: mentor.id, teamId: teamBeta.id } },
    update: {},
    create: { mentorId: mentor.id, teamId: teamBeta.id },
  });
  console.log(`✅ Mentor: ${mentor.email}`);

  // ─── Six program milestones ────────────────────────────────────────────────
  const milestones = [
    { weekNumber: 1, title: 'Team Charter & Problem Statement', description: 'Define your team roles, working agreements, and clearly articulate the problem you are solving — backed by initial evidence.', dueDate: new Date('2026-06-26T17:00:00Z') },
    { weekNumber: 2, title: 'Customer Validation Evidence', description: 'Present at least 10 customer discovery interviews with synthesised insights that validate (or pivot) your problem hypothesis.', dueDate: new Date('2026-07-03T17:00:00Z') },
    { weekNumber: 3, title: 'MVP Scope Locked', description: 'Submit your MVP feature list, wireframes/prototypes, and a build plan with assigned responsibilities.', dueDate: new Date('2026-07-10T17:00:00Z') },
    { weekNumber: 4, title: 'Demoable MVP + Sales Pipeline', description: 'Demonstrate a working MVP and present your sales pipeline — minimum 5 qualified leads with documented outreach.', dueDate: new Date('2026-07-17T17:00:00Z') },
    { weekNumber: 5, title: 'First Paying Client or Qualified Pipeline', description: 'Show proof of first revenue — a signed contract, payment receipt, or a qualified pipeline worth ≥ KES 50,000.', dueDate: new Date('2026-07-24T17:00:00Z') },
    { weekNumber: 6, title: 'Demo Day Pitch Delivered', description: 'Deliver your final 5-minute investor pitch at Demo Day. Slides and recording submitted before the session.', dueDate: new Date('2026-07-29T17:00:00Z') },
  ];

  const createdMilestones = [];
  for (const m of milestones) {
    // Upsert by weekNumber using a raw findFirst + create/update pattern
    const existing = await prisma.milestone.findFirst({ where: { weekNumber: m.weekNumber } });
    let ms;
    if (existing) {
      ms = await prisma.milestone.update({
        where: { id: existing.id },
        data: { title: m.title, description: m.description, dueDate: m.dueDate },
      });
    } else {
      ms = await prisma.milestone.create({ data: m });
    }
    createdMilestones.push(ms);
  }
  console.log('✅ Program milestones created');

  // ─── TeamMilestones (each team × each milestone) ──────────────────────────
  const teams = [teamAlpha, teamBeta, teamGamma];
  for (const team of teams) {
    for (const ms of createdMilestones) {
      await prisma.teamMilestone.upsert({
        where: { teamId_milestoneId: { teamId: team.id, milestoneId: ms.id } },
        update: {},
        create: {
          teamId: team.id,
          milestoneId: ms.id,
          status: MilestoneStatus.NOT_STARTED,
        },
      });
    }
  }
  console.log('✅ Team milestones initialised');

  // ─── Calendar events ───────────────────────────────────────────────────────
  const calendarEvents = [];

  // Tuesday sessions (18:00–20:00 EAT = 15:00–17:00 UTC)
  // 23 June, 30 June, 7 July, 14 July, 21 July 2026
  const tuesdayDates = [
    new Date('2026-06-23T15:00:00Z'),
    new Date('2026-06-30T15:00:00Z'),
    new Date('2026-07-07T15:00:00Z'),
    new Date('2026-07-14T15:00:00Z'),
    new Date('2026-07-21T15:00:00Z'),
  ];

  for (let i = 0; i < tuesdayDates.length; i++) {
    const start = tuesdayDates[i];
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    calendarEvents.push({
      title: `Tuesday Cohort Session ${i + 1}`,
      description: 'Weekly cohort session — link to be updated by facilitator.',
      startTime: start,
      endTime: end,
      eventType: EventType.SESSION,
      isAllTeams: true,
      createdById: admin.id,
    });
  }

  // Saturday sessions (09:30–12:00 EAT = 06:30–09:00 UTC)
  // 27 June, 4 July, 11 July, 18 July, 25 July 2026
  const saturdayDates = [
    new Date('2026-06-27T06:30:00Z'),
    new Date('2026-07-04T06:30:00Z'),
    new Date('2026-07-11T06:30:00Z'),
    new Date('2026-07-18T06:30:00Z'),
    new Date('2026-07-25T06:30:00Z'),
  ];

  for (let i = 0; i < saturdayDates.length; i++) {
    const start = saturdayDates[i];
    const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);
    calendarEvents.push({
      title: `Saturday Workshop ${i + 1}`,
      description: 'Weekly workshop session — link to be updated by facilitator.',
      startTime: start,
      endTime: end,
      eventType: EventType.SESSION,
      isAllTeams: true,
      createdById: admin.id,
    });
  }

  // Milestone deadlines
  for (const ms of createdMilestones) {
    calendarEvents.push({
      title: `Week ${ms.weekNumber} Milestone Deadline: ${ms.title}`,
      description: ms.description,
      startTime: ms.dueDate,
      endTime: new Date(ms.dueDate.getTime() + 60 * 60 * 1000),
      eventType: EventType.MILESTONE_DEADLINE,
      isAllTeams: true,
      createdById: admin.id,
    });
  }

  // Founder Mixer
  calendarEvents.push({
    title: 'Founder Mixer & Cohort Kickoff',
    description: 'Welcome event for all Cohort 2 participants. Meet your fellow founders, facilitators, and mentors.',
    startTime: new Date('2026-06-18T14:00:00Z'),
    endTime: new Date('2026-06-21T17:00:00Z'),
    eventType: EventType.PROGRAM_EVENT,
    isAllTeams: true,
    createdById: admin.id,
  });

  // Demo Day
  calendarEvents.push({
    title: 'Demo Day',
    description: 'Final pitch presentations to investors, partners, and the Skillyme Africa ecosystem.',
    startTime: new Date('2026-07-28T06:00:00Z'),
    endTime: new Date('2026-07-28T11:00:00Z'),
    eventType: EventType.PROGRAM_EVENT,
    isAllTeams: true,
    createdById: admin.id,
  });

  // Gala / Ecosystem Day
  calendarEvents.push({
    title: 'Gala & Ecosystem Day',
    description: 'Celebration and awards ceremony for Cohort 2 graduates.',
    startTime: new Date('2026-07-29T11:00:00Z'),
    endTime: new Date('2026-07-29T17:00:00Z'),
    eventType: EventType.PROGRAM_EVENT,
    isAllTeams: true,
    createdById: admin.id,
  });

  for (const evt of calendarEvents) {
    await prisma.calendarEvent.create({ data: evt });
  }
  console.log(`✅ ${calendarEvents.length} calendar events created`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin      → admin@skillyme.africa / Admin@1234');
  console.log('  Facilitator → facilitator@skillyme.africa / Facilitator@1234');
  console.log('  Mentor     → mentor@skillyme.africa / Mentor@1234');
  console.log('  Members    → alice@example.com … / Member@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
