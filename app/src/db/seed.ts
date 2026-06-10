import { db } from './db';

function makeTime(base: Date, h: number, m = 0): string {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function demoEventTimes(now: Date): { past: (h: number, m?: number) => string; future: (h: number, m?: number) => string } {
  const hour = now.getHours();

  if (hour < 10) {
    return {
      past: (h, m) => makeTime(now, h, m),
      future: (h, m) => makeTime(now, h, m),
    };
  }
  if (hour < 14) {
    return {
      past: (h, m) => makeTime(now, Math.min(h, hour - 1), m),
      future: (h, m) => makeTime(now, Math.max(h, hour + 1), m),
    };
  }
  return {
    past: (h, m) => makeTime(now, Math.min(h, 11), m),
    future: (h, m) => {
      const target = h <= 12 ? hour + 1 : h;
      return makeTime(now, Math.max(target, hour + 1), m);
    },
  };
}

const DEFAULT_ROUTINES = [
  { label: 'Brush teeth', period: 'morning' as const, sortOrder: 0 },
  { label: 'Take morning medication', period: 'morning' as const, sortOrder: 1 },
  { label: 'Eat breakfast', period: 'morning' as const, sortOrder: 2 },
  { label: 'Morning walk or stretch', period: 'morning' as const, sortOrder: 3 },
  { label: 'Afternoon rest or activity', period: 'afternoon' as const, sortOrder: 0 },
  { label: 'Hydrate and snack', period: 'afternoon' as const, sortOrder: 1 },
  { label: 'Eat dinner', period: 'evening' as const, sortOrder: 0 },
  { label: 'Take evening medication', period: 'evening' as const, sortOrder: 1 },
  { label: 'Prepare for bed', period: 'evening' as const, sortOrder: 2 },
];

export async function seedIfEmpty(): Promise<void> {
  const userCount = await db.users.count();
  if (userCount >= 2) {
    await seedExtendedData();
    return;
  }

  const now = new Date();
  const t = demoEventTimes(now);

  if (userCount === 0) {
    const userId = await db.users.add({
      name: 'Margaret',
      age: 78,
      city: 'Shrewsbury, MA',
      homeAddress: '42 Maple Lane, Shrewsbury, MA',
      caregiverName: 'Susan',
      caregiverRelationship: 'daughter',
      caregiverPhone: '+15555550142',
      familyPhotoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      calmingMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      emergencyNote: 'Margaret has mild dementia. Lives alone with daily caregiver visits. Allergic to penicillin.',
      onboardingComplete: true,
      medications: [
        { name: 'Metformin', dosage: '500mg', schedule: ['8:00 AM'] },
        { name: 'Lisinopril', dosage: '10mg', schedule: ['8:00 PM'] },
      ],
      createdAt: now.toISOString(),
    });

    await seedUserExtras(userId, 'Susan', 'daughter', '+15555550142', t, now);
  }

  if ((await db.users.count()) < 2) {
    const userId2 = await db.users.add({
      name: 'Harold',
      age: 81,
      city: 'Worcester, MA',
      homeAddress: '18 Oak Street, Worcester, MA',
      caregiverName: 'James',
      caregiverRelationship: 'son',
      caregiverPhone: '+15555550287',
      familyPhotoUrl: 'https://images.unsplash.com/photo-1566616213894-2d3e1baee564?w=400&h=400&fit=crop',
      calmingMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      emergencyNote: 'Harold uses a walker. Lives with spouse. Contact James first.',
      onboardingComplete: true,
      medications: [
        { name: 'Amlodipine', dosage: '5mg', schedule: ['7:00 AM'] },
        { name: 'Donepezil', dosage: '10mg', schedule: ['9:00 PM'] },
      ],
      createdAt: now.toISOString(),
    });

    await db.events.bulkAdd([
      {
        userId: userId2,
        timestamp: t.past(7, 15),
        type: 'user_action',
        title: 'Morning tea',
        description: 'Harold had tea and toast for breakfast.',
        completed: true,
        source: 'caregiver',
      },
      {
        userId: userId2,
        timestamp: t.future(21, 0),
        type: 'planned',
        title: 'Donepezil — evening dose',
        description: 'Time to take Donepezil 10mg before bed.',
        completed: false,
        source: 'system',
      },
    ]);

    await db.acseScores.add({
      userId: userId2,
      score: 92,
      timestamp: now.toISOString(),
      reason: 'Initial score',
    });

    await db.emergencyContacts.bulkAdd([
      { userId: userId2, name: 'James', relationship: 'son', phone: '+15555550287', isPrimary: true },
      { userId: userId2, name: 'Dr. Patel', relationship: 'physician', phone: '+15555550300', isPrimary: false },
    ]);

    await db.routineTasks.bulkAdd(DEFAULT_ROUTINES.map((r) => ({ ...r, userId: userId2 })));

    await db.familiarFaces.bulkAdd([
      {
        userId: userId2,
        name: 'James',
        relationship: 'Son',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        memoryPrompt: 'This is your son James. He visits every Sunday and loves talking about your garden.',
      },
      {
        userId: userId2,
        name: 'Eleanor',
        relationship: 'Wife',
        photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
        memoryPrompt: 'This is Eleanor, your wife of 52 years. You have breakfast together every morning.',
      },
    ]);
  }
}

async function seedUserExtras(
  userId: number,
  caregiverName: string,
  relationship: string,
  phone: string,
  t: ReturnType<typeof demoEventTimes>,
  now: Date
): Promise<void> {
  await db.events.bulkAdd([
    {
      userId,
      timestamp: t.past(7, 30),
      type: 'user_action',
      title: 'Breakfast',
      description: 'Margaret had oatmeal and orange juice for breakfast.',
      completed: true,
      source: 'caregiver',
    },
    {
      userId,
      timestamp: t.past(8, 5),
      type: 'user_action',
      title: 'Metformin taken',
      description: 'Margaret took Metformin 500mg. Vision verified.',
      completed: true,
      source: 'system',
    },
    {
      userId,
      timestamp: t.past(9, 15),
      type: 'user_action',
      title: 'Morning walk',
      description: 'Margaret took a 20-minute walk in the garden.',
      completed: true,
      source: 'caregiver',
    },
    {
      userId,
      timestamp: t.future(11, 0),
      type: 'planned',
      title: "Daughter's phone call",
      description: 'Susan will call at 11:00 AM to check in.',
      completed: false,
      source: 'caregiver',
    },
    {
      userId,
      timestamp: t.future(20, 0),
      type: 'planned',
      title: 'Lisinopril — evening dose',
      description: 'Time to take Lisinopril 10mg with a glass of water.',
      completed: false,
      source: 'system',
    },
  ]);

  await db.acseScores.add({
    userId,
    score: 100,
    timestamp: now.toISOString(),
    reason: 'Initial score',
  });

  await db.medicationLogs.add({
    userId,
    medicationName: 'Metformin',
    timestamp: t.past(8, 5),
    visionConfidence: 'high',
    visionDescription: 'Pill bottle clearly visible.',
    confirmed: true,
  });

  await db.emergencyContacts.bulkAdd([
    { userId, name: caregiverName, relationship, phone, isPrimary: true },
    { userId, name: 'Dr. Chen', relationship: 'physician', phone: '+15555550311', isPrimary: false },
    { userId, name: 'Neighbor Tom', relationship: 'neighbor', phone: '+15555550456', isPrimary: false },
  ]);

  await db.routineTasks.bulkAdd(DEFAULT_ROUTINES.map((r) => ({ ...r, userId })));

  await db.familiarFaces.bulkAdd([
    {
      userId,
      name: 'Susan',
      relationship: 'Daughter',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      memoryPrompt: 'This is your daughter Susan. She calls you every day and visited last Sunday.',
    },
    {
      userId,
      name: 'Robert',
      relationship: 'Grandson',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      memoryPrompt: 'This is Robert, your grandson. He is 12 and loves playing chess with you.',
    },
    {
      userId,
      name: 'Lily',
      relationship: 'Cat',
      photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
      memoryPrompt: 'This is Lily, your cat. She sleeps on the sunny windowsill every afternoon.',
    },
  ]);

  await db.careJournal.bulkAdd([
    {
      userId,
      timestamp: makeTime(now, 8, 30),
      mood: 'good',
      note: 'Margaret was cheerful at breakfast. Remembered Susan\'s visit from Sunday.',
      author: caregiverName,
    },
    {
      userId,
      timestamp: makeTime(now, 12, 0),
      mood: 'okay',
      note: 'Asked about medication twice before noon. Gently redirected both times.',
      author: caregiverName,
    },
  ]);
}

/** Backfill v3 tables for existing installs */
async function seedExtendedData(): Promise<void> {
  const users = await db.users.toArray();
  for (const user of users) {
    if (!user.id) continue;
    const hasRoutines = (await db.routineTasks.where('userId').equals(user.id).count()) > 0;
    if (!hasRoutines) {
      await db.routineTasks.bulkAdd(DEFAULT_ROUTINES.map((r) => ({ ...r, userId: user.id! })));
    }
    const hasContacts = (await db.emergencyContacts.where('userId').equals(user.id).count()) > 0;
    if (!hasContacts && user.caregiverPhone) {
      await db.emergencyContacts.add({
        userId: user.id,
        name: user.caregiverName,
        relationship: user.caregiverRelationship,
        phone: user.caregiverPhone,
        isPrimary: true,
      });
    }
    if (!user.homeAddress && user.city) {
      await db.users.update(user.id, { homeAddress: user.city, onboardingComplete: true });
    }
    if (!user.emergencyNote) {
      await db.users.update(user.id, {
        emergencyNote: `${user.name} uses Recall for cognitive support. Contact ${user.caregiverName} first.`,
      });
    }
    const hasFaces = (await db.familiarFaces.where('userId').equals(user.id).count()) > 0;
    if (!hasFaces && user.name === 'Margaret') {
      await db.familiarFaces.bulkAdd([
        {
          userId: user.id,
          name: 'Susan',
          relationship: 'Daughter',
          photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
          memoryPrompt: 'This is your daughter Susan. She calls you every day.',
        },
        {
          userId: user.id,
          name: 'Robert',
          relationship: 'Grandson',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
          memoryPrompt: 'This is Robert, your grandson. He loves playing chess with you.',
        },
      ]);
    }
  }
}
