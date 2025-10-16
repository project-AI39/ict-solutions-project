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
  { id: 'evt_1', title: '朝ラン (東京駅)', imageUrl: null, description: '東京駅周辺での朝ランニング', latitude: 35.681236, longitude: 139.767125, authorId: 'usr_1' },
  { id: 'evt_2', title: '英語カフェ (新宿)', imageUrl: null, description: '新宿で英語で雑談するカジュアルな集まり', latitude: 35.690921, longitude: 139.700258, authorId: 'usr_2' },
  { id: 'evt_3', title: 'プログラミング勉強会 (渋谷)', imageUrl: null, description: '渋谷で初心者向けのハンズオン', latitude: 35.658034, longitude: 139.701636, authorId: 'usr_3' },
  { id: 'evt_4', title: '写真散歩 (池袋)', imageUrl: null, description: '池袋周辺をカメラを持って散策', latitude: 35.728926, longitude: 139.71038, authorId: 'usr_4' },
  { id: 'evt_5', title: 'ピアノ発表会 (上野)', imageUrl: null, description: '上野での参加自由のミニ発表会', latitude: 35.713768, longitude: 139.777254, authorId: 'usr_5' },
  { id: 'evt_6', title: 'ボードゲーム大会 (浅草)', imageUrl: null, description: '浅草で友達とボードゲームを楽しむ会', latitude: 35.714765, longitude: 139.796655, authorId: 'usr_6' },
  { id: 'evt_7', title: 'ハイキング (六本木)', imageUrl: null, description: '六本木近辺の散策（徒歩）', latitude: 35.660509, longitude: 139.729099, authorId: 'usr_7' },
  { id: 'evt_8', title: 'アートワークショップ (銀座)', imageUrl: null, description: '銀座で絵を描くワークショップ', latitude: 35.671717, longitude: 139.764878, authorId: 'usr_8' },
  { id: 'evt_9', title: '映画鑑賞会 (お台場)', imageUrl: null, description: 'お台場でみんなで映画を観る会', latitude: 35.629000, longitude: 139.776000, authorId: 'usr_9' },
  { id: 'evt_10', title: '料理教室 (中野)', imageUrl: null, description: '中野でお手軽レシピを学ぶ', latitude: 35.707398, longitude: 139.665450, authorId: 'usr_10' },
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
