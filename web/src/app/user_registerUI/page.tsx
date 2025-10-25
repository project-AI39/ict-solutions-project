'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Link,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// パスワード強度チェック関数
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  if (score < 40) return { score, label: '弱い', color: 'error.main' };
  if (score < 70) return { score, label: '普通', color: 'warning.main' };
  return { score, label: '強い', color: 'success.main' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(pw), [pw]);
  const passwordsMatch = pw.length > 0 && pw2.length > 0 && pw === pw2;

  // バリデーション
  const usernameError = username.length > 0 && (username.length < 3 || username.length > 20);
  const passwordError = pw.length > 0 && pw.length < 8;
  const isFormValid =
    username.length >= 3 &&
    username.length <= 20 &&
    pw.length >= 8 &&
    passwordsMatch &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // フロントエンドバリデーション
    if (!username.trim()) {
      setErr('ユーザー名を入力してください。');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      setErr('ユーザー名は3〜20文字で入力してください。');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErr('ユーザー名は半角英数字とアンダースコアのみ使用できます。');
      return;
    }
    if (pw.length < 8) {
      setErr('パスワードは8文字以上で入力してください。');
      return;
    }
    if (!passwordsMatch) {
      setErr('パスワードが一致しません。');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user_register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? '登録に失敗しました。');
      }

      setOk('登録が完了しました。ログインページへ移動します。');
      setTimeout(() => router.push('/login'), 1500);
    } catch (e: any) {
      // ネットワークエラーの場合
      if (e?.message === 'Failed to fetch') {
        setErr('ネットワークエラーが発生しました。接続を確認してください。');
      } else {
        setErr(e?.message ?? 'エラーが発生しました。');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/user_registerUI/icon.png"
              alt="アプリアイコン"
              sx={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                mb: 1,
                display: 'block',        // ← 追加
                mx: 'auto'               // ← 追加（margin left/right auto）
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              新規登録
            </Typography>
          </Box>

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
            {err && <Alert severity="error">{err}</Alert>}
            {ok && <Alert severity="success">{ok}</Alert>}

            <TextField
              label="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              autoComplete="username"
              error={usernameError}
              helperText={
                usernameError
                  ? 'ユーザー名は3〜20文字の半角英数字で入力してください'
                  : '3〜20文字の半角英数字とアンダースコア'
              }
              inputProps={{
                'aria-label': 'ユーザー名',
                maxLength: 20,
              }}
            />

            <Box>
              <TextField
                label="パスワード"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                fullWidth
                autoComplete="new-password"
                error={passwordError}
                helperText={passwordError ? 'パスワードは8文字以上で入力してください' : '8文字以上推奨'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPw((v) => !v)}
                        edge="end"
                        aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
                      >
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'パスワード',
                }}
              />
              {pw.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength.score}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: passwordStrength.color,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: passwordStrength.color, fontWeight: 600, minWidth: 40 }}>
                      {passwordStrength.label}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <TextField
              label="パスワード（確認）"
              type={showPw2 ? 'text' : 'password'}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              fullWidth
              error={pw2.length > 0 && !passwordsMatch}
              helperText={
                pw2.length > 0 && !passwordsMatch
                  ? 'パスワードが一致しません'
                  : 'もう一度入力してください'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPw2((v) => !v)}
                      edge="end"
                      aria-label={showPw2 ? 'パスワード確認を隠す' : 'パスワード確認を表示'}
                    >
                      {showPw2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                'aria-label': 'パスワード確認',
              }}
            />

            <Typography variant="body2" color="text.secondary">
              登録により
              {' '}
              <Link component={NextLink} href="/terms" underline="always" color="primary">
                利用規約
              </Link>
              {' '}
              に同意したものとみなされます。
            </Typography>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!isFormValid}
              sx={{ mt: 1 }}
            >
              {loading ? '登録中…' : '登録する'}
            </Button>

            <Typography align="center" variant="body2" sx={{ mt: 1 }}>
              すでにアカウントをお持ちですか？{' '}
              <Link component={NextLink} href="/login" underline="always">
                ログイン
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}