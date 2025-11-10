"use client";

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { LatLngTuple } from 'leaflet'; 
import type { MapClickMarkerProps } from '@/components/MapClickMarker'; 
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Link from 'next/link';

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

// =========================================================
// Dynamic Import
// =========================================================
const DynamicClickableMap = dynamic(() => import('@/components/MapClickMarker'), {
  ssr: false, 
  loading: () => <p className="text-gray-500">地図を読み込み中...</p>,
}) as React.ComponentType<MapClickMarkerProps>; 

// =========================================================
// イベント投稿ページのメインコンポーネント
// =========================================================
export default function PostEventPage() {
  const router = useRouter();
  // 1. ステップ管理用のステート
  const [step, setStep] = useState(1);

  // 2. フォームデータを一元管理（imageを追加）
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventstartDay: '',
    eventfinishDay: '',
    latitude: null as number | null, 
    longitude: null as number | null,
    image: null as File | null, 
  });

  // 3. 読み込み中ステートを追加
  const [isLoading, setIsLoading] = useState(false);

  const [navValue, setNavValue] = useState(2); // 2 = 投稿 (0から数えて)
  const navHeight = 64; // px

  const [mapCenter, setMapCenter] = useState<LatLngTuple | null>(null);

  // フォームデータから現在のLatLngTupleを作成（useMemoでメモ化）
  const currentPosition: LatLngTuple | null = useMemo(() => 
    (formData.latitude !== null && formData.longitude !== null) 
    ? [formData.latitude, formData.longitude] 
    : null
  , [formData.latitude, formData.longitude]);

  useEffect(() => {
    // ステップ2（地図表示）の時、かつ、まだ中心が設定されていなければ実行
    if (step === 2 && mapCenter === null) {
      // 1. ピンがすでにあればそこを中央に
      if (currentPosition) {
        setMapCenter(currentPosition);
      } 
      // 2. ピンがなければ現在地を取得（Geolocation APIを使用）
      else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // 取得成功: 現在地を地図の中心に設定
            setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          },
          (err) => {
            console.warn("現在地の取得に失敗:", err);
            // 失敗: 東京駅（デフォルト）を地図の中心に設定
            setMapCenter([35.681236, 139.767125]); 
          }
        );
      } 
      // 3. Geolocation非対応: 東京駅（デフォルト）
      else {
        console.warn("Geolocation非対応");
        setMapCenter([35.681236, 139.767125]);
      }
    }
  }, [step, currentPosition, mapCenter]);  

  // --- ステップ操作ハンドラ ---
  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // --- フォーム入力ハンドラ ---
  const handleMapPositionChange = useCallback((lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
    }
  };

  const handleRemoveImage = useCallback(() => {
    setFormData(prev => ({ ...prev, image: null }));
    // ファイル入力の値をリセット
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // 値をクリア
    }
  }, []); // 依存配列は空でOK

  // =========================================================
  // --- 最終送信ハンドラ (API呼び出し) ---
  // =========================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 既に読み込み中なら何もしない
    if (isLoading) return;

    // フォームバリデーション
    if (!formData.title || !formData.latitude || !formData.longitude || !formData.eventstartDay || !formData.eventfinishDay) {
        // descriptionは任意なのでバリデーションから除外
        alert("必須項目（タイトル、開始日、終了日、場所）が入力されていません。");
        if (!formData.title) setStep(1);
        else if (!formData.latitude) setStep(2);
        return;
    }

    // 読み込み開始
    setIsLoading(true);

    // 1. データを「FormData」（小包）に詰める
    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    // descriptionは任意（''の場合もある）
    dataToSend.append('description', formData.description || ''); 
    dataToSend.append('eventstartDay',formData.eventstartDay);
    dataToSend.append('eventfinishDay',formData.eventfinishDay);
    dataToSend.append('latitude', String(formData.latitude));
    dataToSend.append('longitude', String(formData.longitude));

    // 画像ファイルが存在する場合のみ、小包に入れる
    if (formData.image) {
      dataToSend.append('image', formData.image);
    }

    try {
      // 2. APIエンドポイントにデータをPOSTで送信
      const response = await fetch('/api/events', {
        method: 'POST',
        // ⚠️ 'Content-Type' ヘッダーは削除する！
        // (ブラウザがFormDataを使うと自動で正しいヘッダーを付けてくれます)
        body: dataToSend, // 👈 JSON.stringify ではなく FormData をそのまま渡す
      });

      if (!response.ok) {
        // サーバーがエラーを返した場合
        const errorData = await response.json();
        throw new Error(errorData.message || '投稿に失敗しました');
      }

      // 3. 成功した場合
      const newEvent = await response.json();
      console.log('投稿成功:', newEvent);
      alert('イベントを投稿しました！');
      
      // フォームを初期化して最初のステップに戻る
      setFormData({
          title: '', description: '', eventstartDay: '', eventfinishDay: '', latitude: null, longitude: null, image: null,
      });
      //ホーム画面に遷移
      router.push('/');

    } catch (error) {
      // 4. ネットワークエラーやその他のエラー
      console.error('送信エラー:', error);
      if (error instanceof Error) {
        alert(`エラー: ${error.message}`);
      } else {
        alert('投稿中に不明なエラーが発生しました');
      }
    } finally {
      // 5. 読み込み完了
      setIsLoading(false);
    }
  };
  

  return (
    // ページ全体をフッター分だけパディング
    <Box sx={{ pb: `${navHeight}px`, minHeight: '100vh', bgcolor: 'grey.100' }}>
      
      {/* 既存のフォームコンテナ */}
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
          
          {/* --- ステップ 1: イベント情報入力 ---  */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">イベント情報入力</h1>
              
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">イベント名</label>
                <input
                  type="text" name="title" id="title"
                  value={formData.title} onChange={handleFormChange}
                  placeholder="例: ハッカソン 2025" required
                  className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="eventstartDay" className="block text-sm font-medium text-gray-700">イベント開始日</label>
                <input
                  type="date" name="eventstartDay" id="eventstartDay"
                  value={formData.eventstartDay} onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="eventfinishDay" className="block text-sm font-medium text-gray-700">イベント終了日</label>
                <input
                  type="date" name="eventfinishDay" id="eventfinishDay"
                  value={formData.eventfinishDay} onChange={handleFormChange} 
                  required
                  className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">詳細</label>
                <textarea
                  name="description" id="description" rows={4}
                  value={formData.description} onChange={handleFormChange}
                  placeholder="例: 有意義な時間を過ごすことができました。(任意)"
                  className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                次へ (場所を選択)
              </button>
            </form>
          )}

          {/* --- ステップ 2: 地図で場所を選択 --- */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">開催場所を選択</h1>
              <p className="text-sm text-gray-600 mb-4">地図をクリックしてピンを配置してください。</p>
              
              <div style={{ height: '400px', width: '100%' }} className="rounded-md overflow-hidden border border-gray-300">
                {!mapCenter ? (
                  <p className="text-gray-500 p-4">現在地を取得中...</p>
                ) : (
                  <DynamicClickableMap 
                    onPositionChange={handleMapPositionChange} 
                    currentPosition={currentPosition}
                    center={mapCenter} // 👈 取得した現在地またはデフォルト位置を渡す
                  />
                )}
              </div>
              
              {currentPosition && (
                <p className="mt-4 text-center text-green-600 font-medium">
                  ✅ 場所が選択されました
                </p>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="py-2 px-4 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">
                  戻る
                </button>
                <button 
                  onClick={handleNext} 
                  disabled={!currentPosition} 
                  className="py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  次へ (写真を追加)
                </button>
              </div>
            </div>
          )}

          {/* --- ステップ 3: 写真追加 ---  */}
          {step === 3 && (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">写真を追加</h1>
              <p className="text-sm text-gray-600 mb-4">イベントのメイン画像を選択してください（任意）。</p>
              
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-indigo-50 file:text-indigo-700
                           hover:file:bg-indigo-100"
              />
              
              {formData.image && (
                <div className="mt-6 border rounded-lg overflow-hidden relative">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 z-10 p-1 bg-gray-800 bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity"
                    aria-label="画像を削除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="選択された画像のプレビュー" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="py-2 px-4 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">
                  戻る
                </button>
                <button onClick={handleNext} className="py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  次へ (プレビュー)
                </button>
              </div>
            </div>
          )}

          {/* --- ステップ 4: プレビュー・投稿確認 --- */}
          {step === 4 && (
            <form onSubmit={handleSubmit}>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">投稿プレビュー</h1>
              
              {formData.image ? (
                <div className="mb-4 border rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="投稿プレビュー" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 border rounded-lg h-48 flex items-center justify-center bg-gray-100 text-gray-400">
                  (画像なし)
                </div>
              )}

              <div className="mb-4 space-y-2">
                <h2 className="text-2xl font-semibold">{formData.title}</h2>
                {formData.description && (
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">開催場所</label>
                <div style={{ height: '300px', width: '100%' }} className="rounded-md overflow-hidden border border-gray-300">
                  <DynamicClickableMap 
                    currentPosition={currentPosition}
                    readOnly={true} 
                    center={currentPosition ?? undefined}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button 
                  onClick={handleBack} 
                  type="button" 
                  disabled={isLoading}
                  className="py-2 px-4 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  戻る
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="py-2 px-4 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isLoading ? '投稿中...' : 'この内容で投稿する'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* --- 🔽 Bottom navigation (ホームページからコピー) 🔽 --- */}
      <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1200 }}>
        <Paper elevation={8} sx={{ position: "relative" }}>
          <BottomNavigation
            showLabels
            value={navValue} // 👈 投稿ページなので '2' (投稿) をアクティブに
            onChange={(event, newValue) => {
              // ページ遷移はLinkコンポーネントが行うので、ここではステート更新のみ
              setNavValue(newValue);
            }}
            sx={{ height: navHeight }}
          >
            <BottomNavigationAction component={Link} href="/" label="ホーム" icon={<HomeIcon />} />
            <BottomNavigationAction component={Link} href="/search" label="検索" icon={<SearchIcon />} />
            <BottomNavigationAction component={Link} href="/post" label="投稿" icon={<AddCircleOutlineIcon />} />
            <BottomNavigationAction component={Link} href="/user" label="ユーザー" icon={<PersonIcon />} />
            <BottomNavigationAction component={Link} href="/settings" label="設定" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
      {/* --- 🔼 追加ここまで 🔼 --- */}

    </Box>
  );
}