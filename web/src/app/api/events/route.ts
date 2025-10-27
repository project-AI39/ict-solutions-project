import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import fs from "fs/promises";
import path from "path";
import { z, ZodError } from "zod"; //npm install zod
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "DEV_SECRET_KEY";

// フォームデータの型を定義
const eventFormSchema = z.object({
  title: z.string().min(1, { message: "タイトルは必須です" }),
  description: z.preprocess(
    (val) => (val === '' ? null : val), // 空文字をnullに変換
    z.string().nullable().optional()     // null または string を許容
  ),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  image: z.preprocess(
    (val) => (val === null ? null : val), // null をそのまま許可
    z.instanceof(File).nullable().optional() // null または File を許容
  ),
  eventstartDay: z.string().min(1, { message: "開始日は必須です" }),
  eventfinishDay: z.string().min(1, { message: "終了日は必須です" }),
});

/**
 * POST /api/events
 * イベントを新規作成します。
 * ログインユーザーのIDを authorId に設定します。
 */
export async function POST(request: NextRequest) {
  try {
    // --- 🔽 認証チェックを追加 🔽 ---
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: '認証されていません' }, { status: 401 });
    }

    let decodedPayload: JwtPayload | string;
    try {
      decodedPayload = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      return NextResponse.json({ message: '無効なトークンです' }, { status: 401 });
    }

    // トークンからユーザーIDを取得 (login/route.ts の sign 時のペイロードに合わせる)
    const userId = typeof decodedPayload === 'object' ? decodedPayload.userId : null;
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ message: 'トークンからユーザーIDを取得できませんでした' }, { status: 400 });
    }
    // --- 🔼 認証チェックここまで 🔼 ---

    // FormData処理とバリデーション
    const formData = await request.formData();
    const parsedData = eventFormSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      latitude: formData.get('latitude'),
      longitude: formData.get('longitude'),
      image: formData.get('image'),
      eventstartDay: formData.get('eventstartDay'),
      eventfinishDay: formData.get('eventfinishDay'),
    });
    if (!parsedData.success) {
      return NextResponse.json({ message: 'データ形式が正しくありません', errors: parsedData.error.errors }, { status: 400 });
    }
    const { title, description, latitude, longitude, image, eventstartDay, eventfinishDay} = parsedData.data;

    // 画像保存処理
    let imageUrl: string | null = null;
    if (image) {
      const filename = `${Date.now()}-${image.name.replace(/\s+/g, '_')}`;
      const saveDir = path.join(process.cwd(), "public", "images");
      const savePath = path.join(saveDir, filename);
      imageUrl = `/images/${filename}`;
      try {
        await fs.mkdir(saveDir, { recursive: true });
        const buffer = Buffer.from(await image.arrayBuffer());
        await fs.writeFile(savePath, buffer);
      } catch (e) {
        console.error("画像保存エラー:", e);
        return NextResponse.json({ message: "画像の保存に失敗しました。" }, { status: 500 });
      }
    }

    // Prismaでイベント作成
    const newEvent = await prisma.event.create({
      data: {
        title: title,
        description: description,
        latitude: latitude,
        longitude: longitude,
        imageUrl: imageUrl,
        authorId: userId,
        eventstartDay: new Date(eventstartDay),
        eventfinishDay: new Date(eventfinishDay),
      },
    });

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('イベント投稿エラー:', error);
    return NextResponse.json({ message: 'サーバー側でエラーが発生しました' }, { status: 500 });
  }
}

/**
 * GET /api/events
 * クエリパラメータ:
 *   - minLat: 最小緯度 (南西角の緯度)
 *   - minLng: 最小経度 (南西角の経度)
 *   - maxLat: 最大緯度 (北東角の緯度)
 *   - maxLng: 最大経度 (北東角の経度)
 *
 * 指定されたバウンディングボックス内のイベントを返します。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minLat = searchParams.get("minLat");
    const minLng = searchParams.get("minLng");
    const maxLat = searchParams.get("maxLat");
    const maxLng = searchParams.get("maxLng");

    // パラメータのバリデーション
    if (!minLat || !minLng || !maxLat || !maxLng) {
      return NextResponse.json(
        { error: "minLat, minLng, maxLat, maxLng are required" },
        { status: 400 }
      );
    }

    const minLatNum = parseFloat(minLat);
    const minLngNum = parseFloat(minLng);
    const maxLatNum = parseFloat(maxLat);
    const maxLngNum = parseFloat(maxLng);

    // 数値変換の確認
    if (
      isNaN(minLatNum) ||
      isNaN(minLngNum) ||
      isNaN(maxLatNum) ||
      isNaN(maxLngNum)
    ) {
      return NextResponse.json(
        { error: "Invalid coordinate values" },
        { status: 400 }
      );
    }

    // バウンディングボックス内のイベントを取得
    // latitude が minLat と maxLat の間、longitude が minLng と maxLng の間
    const events = await prisma.event.findMany({
      where: {
        latitude: {
          gte: minLatNum,
          lte: maxLatNum,
        },
        longitude: {
          gte: minLngNum,
          lte: maxLngNum,
        },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        description: true,
        createdAt: true,
      },
      // パフォーマンス対策: 大量のデータを防ぐため上限を設定
      take: 500,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
