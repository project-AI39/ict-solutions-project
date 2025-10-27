import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// "true" ならハッシュ機能ON
export const HASH_ENABLED =
    (process.env.PASSWORD_HASH_ENABLED ?? "true").toLowerCase() === "true";

// 本番でハッシュOFFは強制停止（安全ガード）
if (process.env.NODE_ENV === "production" && !HASH_ENABLED) {
    throw new Error(
        "PASSWORD_HASH_ENABLED=false は本番では使用できません。環境変数を true にしてください。"
    );
}

// DBに保存する値を作る（ハッシュONならbcrypt、OFFなら平文）
export async function toStorablePassword(raw: string): Promise<string> {
    return HASH_ENABLED ? bcrypt.hash(raw, SALT_ROUNDS) : raw;
}

// 入力rawと保存値storedの一致判定
export async function verifyPassword(raw: string, stored: string): Promise<boolean> {
    const isBcryptHash =
        stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");

    if (isBcryptHash) return bcrypt.compare(raw, stored);
    // 保存が平文の場合
    return raw === stored;
}

// “自動移行が必要か”判定（ハッシュONかつ保存が平文なら true）
export function needsRehash(stored: string): boolean {
    const isBcryptHash =
        stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    return HASH_ENABLED && !isBcryptHash;
}
