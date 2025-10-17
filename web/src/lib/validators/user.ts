import { z } from "zod";

export const profileUpdateSchema = z.object({
  email: z.string().email("メールアドレスの形式が不正です"),
  name: z.string().min(1, "ユーザー名を入力してください").trim(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    changePassword: z.literal(true),
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z.string().min(8, "新しいパスワードは8文字以上にしてください"),
    confirm: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "確認用パスワードが一致しません",
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
