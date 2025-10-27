import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// テスト用: パスワードはプレーン文字列で保存する（本番ではハッシュ必須）
const USERS = [
  { id: 'usr_1', username: 'alice', password: 'alice_pass', points: 10 },
  { id: 'usr_2', username: 'bob', password: 'bob_pass', points: 5 },
  { id: 'usr_3', username: 'carol', password: 'carol_pass', points: 0 },
  { id: 'usr_4', username: 'dave', password: 'dave_pass', points: 2 },
  { id: 'usr_5', username: 'eve', password: 'eve_pass', points: 7 },
  { id: 'usr_6', username: 'frank', password: 'frank_pass', points: 1 },
  { id: 'usr_7', username: 'grace', password: 'grace_pass', points: 3 },
  { id: 'usr_8', username: 'heidi', password: 'heidi_pass', points: 4 },
  { id: 'usr_9', username: 'ivan', password: 'ivan_pass', points: 6 },
  { id: 'usr_10', username: 'judy', password: 'judy_pass', points: 8 },
];

const EVENTS = [
  {
    id: "evt_1",
    title: "朝ラン (東京駅)",
    description: "東京駅周辺での朝ランニング",
    imageUrl: "/images/test1.png",
    latitude: 35.681236,
    longitude: 139.767125,
    createdAt: new Date("2025-11-16"),
    authorId: "usr_1",
  },
  {
    id: "evt_2",
    title: "英語カフェ (新宿)",
    description: "新宿で英語で雑談するカジュアルな集まり",
    imageUrl: "https://placehold.co/200x150?text=英語カフェ",
    latitude: 35.690921,
    longitude: 139.700258,
    createdAt: new Date("2025-11-17"),
    authorId: "usr_2",
  },
  {
    id: "evt_3",
    title: "プログラミング勉強会 (渋谷)",
    description: "渋谷で初心者向けのハンズオン",
    imageUrl: "https://placehold.co/200x150?text=プログラミング勉強会",
    latitude: 35.658034,
    longitude: 139.701636,
    createdAt: new Date("2025-11-18"),
    authorId: "usr_3",
  },
  {
    id: "evt_4",
    title: "写真散歩 (池袋)",
    description: "池袋周辺をカメラを持って散策",
    imageUrl: "https://placehold.co/200x150?text=写真散歩",
    latitude: 35.728926,
    longitude: 139.71038,
    createdAt: new Date("2025-11-19"),
    authorId: "usr_4",
  },
  {
    id: "evt_5",
    title: "ピアノ発表会 (上野)",
    description: "上野での参加自由のミニ発表会",
    imageUrl: "https://placehold.co/200x150?text=ピアノ発表会",
    latitude: 35.713768,
    longitude: 139.777254,
    createdAt: new Date("2025-11-20"),
    authorId: "usr_5",
  },
  {
    id: "evt_6",
    title: "ボードゲーム大会 (浅草)",
    description: "浅草で友達とボードゲームを楽しむ会",
    imageUrl: "https://placehold.co/200x150?text=ボードゲーム大会",
    latitude: 35.714765,
    longitude: 139.796655,
    createdAt: new Date("2025-11-21"),
    authorId: "usr_6",
  },
  {
    id: "evt_7",
    title: "ハイキング (六本木)",
    description: "六本木近辺の散策（徒歩）",
    imageUrl: "https://placehold.co/200x150?text=ハイキング",
    latitude: 35.660509,
    longitude: 139.729099,
    createdAt: new Date("2025-11-22"),
    authorId: "usr_7",
  },
  {
    id: "evt_8",
    title: "アートワークショップ (銀座)",
    description: "銀座で絵を描くワークショップ",
    imageUrl: "https://placehold.co/200x150?text=アートワークショップ",
    latitude: 35.671717,
    longitude: 139.764878,
    createdAt: new Date("2025-11-23"),
    authorId: "usr_8",
  },
  {
    id: "evt_9",
    title: "映画鑑賞会 (お台場)",
    description: "お台場でみんなで映画を観る会",
    imageUrl: "https://placehold.co/200x150?text=映画鑑賞会",
    latitude: 35.629,
    longitude: 139.776,
    createdAt: new Date("2025-11-24"),
    authorId: "usr_9",
  },
  {
    id: "evt_10",
    title: "陶芸ワークショップ (京都)",
    description: "京都で本格的な陶芸を体験",
    imageUrl: "https://placehold.co/200x150?text=陶芸",
    latitude: 35.0116,
    longitude: 135.7681,
    createdAt: new Date("2025-10-12"),
    authorId: "usr_1",
  },
  {
    id: "evt_11",
    title: "ダンスレッスン (渋谷)",
    description: "渋谷で楽しくダンスを学ぶ",
    imageUrl: "https://placehold.co/200x150?text=ダンス",
    latitude: 35.6595,
    longitude: 139.7005,
    createdAt: new Date("2025-11-18"),
    authorId: "usr_10",
  },
  {
    id: "evt_12",
    title: "ランニングイベント (大阪)",
    description: "大阪の公園でみんなでランニング",
    imageUrl: "https://placehold.co/200x150?text=ランニング",
    latitude: 34.6937,
    longitude: 135.5023,
    createdAt: new Date("2025-11-05"),
    authorId: "usr_2",
  },
  {
    id: "evt_13",
    title: "コーヒーセミナー (福岡)",
    description: "福岡で美味しいコーヒーの淹れ方を学ぶ",
    imageUrl: "https://placehold.co/200x150?text=コーヒー",
    latitude: 33.5902,
    longitude: 130.4017,
    createdAt: new Date("2025-11-15"),
    authorId: "usr_3",
  },
  {
    id: "evt_14",
    title: "ヨガ教室 (札幌)",
    description: "札幌でリフレッシュヨガ",
    imageUrl: "https://placehold.co/200x150?text=ヨガ",
    latitude: 43.0618,
    longitude: 141.3545,
    createdAt: new Date("2025-12-01"),
    authorId: "usr_4",
  },
  {
    id: "evt_15",
    title: "料理教室 (中野)",
    description: "中野でお手軽レシピを学ぶ",
    imageUrl: "https://placehold.co/200x150?text=料理教室",
    latitude: 35.707398,
    longitude: 139.66545,
    createdAt: new Date("2025-11-25"),
    authorId: "usr_5",
  },
  {
    id: "evt_16",
    title: "絵画ワークショップ (名古屋)",
    description: "名古屋で初心者向け絵画体験",
    imageUrl: "https://placehold.co/200x150?text=絵画",
    latitude: 35.1815,
    longitude: 136.9066,
    createdAt: new Date("2025-10-20"),
    authorId: "usr_6",
  },
  {
    id: "evt_17",
    title: "音楽ライブ (横浜)",
    description: "横浜でアコースティックライブを楽しむ",
    imageUrl: "https://placehold.co/200x150?text=ライブ",
    latitude: 35.4437,
    longitude: 139.6380,
    createdAt: new Date("2025-11-10"),
    authorId: "usr_7",
  },
  {
    id: "evt_18",
    title: "写真教室 (鎌倉)",
    description: "鎌倉で風景写真を学ぶ",
    imageUrl: "https://placehold.co/200x150?text=写真",
    latitude: 35.3199,
    longitude: 139.5508,
    createdAt: new Date("2025-12-05"),
    authorId: "usr_8",
  },
  {
    id: "evt_19",
    title: "キャンプ体験 (長野)",
    description: "長野で初心者向けキャンプ体験",
    imageUrl: "https://placehold.co/200x150?text=キャンプ",
    latitude: 36.6513,
    longitude: 138.1810,
    createdAt: new Date("2025-10-30"),
    authorId: "usr_9",
  },
];


// 参加関係をいくつか作る（例: user1..user5 がイベント1に参加など）
const PARTICIPATIONS = [
  { userId: 'usr_1', eventId: 'evt_1' },
  { userId: 'usr_2', eventId: 'evt_1' },
  { userId: 'usr_3', eventId: 'evt_2' },
  { userId: 'usr_4', eventId: 'evt_3' },
  { userId: 'usr_5', eventId: 'evt_4' },
  { userId: 'usr_6', eventId: 'evt_5' },
  { userId: 'usr_7', eventId: 'evt_6' },
  { userId: 'usr_8', eventId: 'evt_7' },
  { userId: 'usr_9', eventId: 'evt_8' },
  { userId: 'usr_10', eventId: 'evt_9' },
];

async function seed() {
  // users
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { username: u.username },
      // 型安全のため、既存レコードへの update は空にして冪等にする
      update: {},
      create: u,
    });
  }

  // events
  for (const e of EVENTS) {
    await prisma.event.upsert({
      where: { id: e.id },
      // 型安全のため、既存レコードへの update は空にして冪等にする
      update: {},
      create: e,
    });
  }

  // participations
  for (const p of PARTICIPATIONS) {
    try {
      // Prisma クライアントの型が未生成の可能性があるため any 経由で作成
      await (prisma as any).eventParticipant.create({ data: { userId: p.userId, eventId: p.eventId } });
    } catch (e: any) {
      // 重複などは無視して先へ進める
      if (e?.code === 'P2002') continue;
      throw e;
    }
  }

  console.log('[seed] completed');
}

seed()
  .catch((e) => {
    console.error('[seed] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
