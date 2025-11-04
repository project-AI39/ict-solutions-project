import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// フォームデータの型を定義
// const eventFormSchema = z.object({
//   title: z.string().min(1, { message: "タイトルは必須です" }),
//   description: z.preprocess(
//     (val) => (val === '' ? null : val), // 空文字をnullに変換
//     z.string().nullable().optional()     // null または string を許容
//   ),
//   latitude: z.coerce.number(),
//   longitude: z.coerce.number(),
//   image: z.preprocess(
//     (val) => (val === null ? null : val), // null をそのまま許可
//     z.instanceof(File).nullable().optional() // null または File を許容
//   ),
//   eventstartDay: z.string().min(1, { message: "開始日は必須です" }),
//   eventfinishDay: z.string().min(1, { message: "終了日は必須です" }),
// });

/**
 * POST /api/events
 * イベントを新規作成します。
 * ログインユーザーのIDを authorId に設定します。
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    // FormData処理とバリデーション
    const formData = await request.formData();

    const errors: { field: string, message: string }[] = [];

    const titleValue = formData.get('title');
    let title: string;
    if (typeof titleValue === 'string' && titleValue.trim() !== '') {
      title = titleValue;
    } else {
      errors.push({ field: 'title', message: 'タイトルは必須です' });
      title = ''; // エラーだが型推論のため代入
    }

    const descriptionValue = formData.get('description');
    let description: string | null = null;
    if (typeof descriptionValue === 'string' && descriptionValue !== '') {
      description = descriptionValue;
    }

    // 'latitude' のバリデーション (number, 必須)
    const latitudeValue = formData.get('latitude');
    let latitude: number;
    const latNum = parseFloat(String(latitudeValue)); // 'latitude' が null でも String() は "null" にする
    if (latitudeValue !== null && !isNaN(latNum)) {
      latitude = latNum;
    } else {
      errors.push({ field: 'latitude', message: '緯度が無効な値です' });
      latitude = 0; // エラーだが型推論のため代入
    }

    // 'longitude' のバリデーション (number, 必須)
    const longitudeValue = formData.get('longitude');
    let longitude: number;
    const lngNum = parseFloat(String(longitudeValue));
    if (longitudeValue !== null && !isNaN(lngNum)) {
      longitude = lngNum;
    } else {
      errors.push({ field: 'longitude', message: '経度が無効な値です' });
      longitude = 0; // エラーだが型推論のため代入
    }

    // 'image' のバリデーション (File | null)
    // formData.get() は File オブジェクトか、 "null"(string) か、 null(JS) を返す
    const imageValue = formData.get('image');
    let image: File | null = null;
    
    if (imageValue === null) {
        // 添付なし (JSのnull)
        image = null;
    } else if (imageValue instanceof File) {
        // Fileオブジェクト
        image = imageValue;
    } else {
        // "null"(string) や ""(string) やその他の値が来た場合
        // 元のZodスキーマではこれらはエラーとなる
        errors.push({ field: 'image', message: '画像データ形式が正しくありません (Fileまたはnullである必要があります)' });
    }

    // 'eventstartDay' のバリデーション (string, 必須)
    const eventstartDayValue = formData.get('eventstartDay');
    let eventstartDay: string;
    if (typeof eventstartDayValue === 'string' && eventstartDayValue.trim() !== '') {
      eventstartDay = eventstartDayValue;
    } else {
      errors.push({ field: 'eventstartDay', message: '開始日は必須です' });
      eventstartDay = ''; // エラーだが型推論のため代入
    }

    // 'eventfinishDay' のバリデーション (string, 必須)
    const eventfinishDayValue = formData.get('eventfinishDay');
    let eventfinishDay: string;
    if (typeof eventfinishDayValue === 'string' && eventfinishDayValue.trim() !== '') {
      eventfinishDay = eventfinishDayValue;
    } else {
      errors.push({ field: 'eventfinishDay', message: '終了日は必須です' });
      eventfinishDay = ''; // エラーだが型推論のため代入
    }

    // バリデーションエラーがあれば、400を返す
    if (errors.length > 0) {
      return NextResponse.json({ message: 'データ形式が正しくありません', errors: errors }, { status: 400 });
    }
    // --- 🔼 手動バリデーションここまで 🔼 ---


    // 画像保存処理 (変更なし)
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
