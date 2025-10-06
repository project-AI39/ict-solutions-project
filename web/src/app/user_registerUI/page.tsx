'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!username.trim() || !password) {
      setMsg('ユーザー名とパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setMsg('登録が完了しました！（ダミー）');
    } catch {
      setMsg('登録に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'white', // 🔥 背景を白に
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                bgcolor: '#e8f5e9',
                color: 'white',
                width: 96,
                height: 96,
                borderRadius: '50%',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 48,
              }}
            >
              🗺️
            </Box>
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
              新規登録
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="ユーザー名"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="パスワード"
              variant="outlined"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((v) => !v)} edge="end">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="body2" color="text.secondary">
              登録により
              <Link href="/terms" style={{ color: '#1976d2', textDecoration: 'underline' }}>
                利用規約
              </Link>
              に同意したものとみなされます。
            </Typography>

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 1, bgcolor: 'primary.main' }}
              disabled={loading}
            >
              {loading ? '送信中…' : '登録する'}
            </Button>

            {msg && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                {msg}
              </Typography>
            )}
          </Box>

          <Typography align="center" variant="body2" sx={{ mt: 3 }}>
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" style={{ color: '#1976d2', textDecoration: 'underline' }}>
              ログイン
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
