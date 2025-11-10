"use client";

// 🔽 useEffect と TextField, Button をインポート
import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { LatLngTuple } from 'leaflet'; 
import type { MapClickMarkerProps } from '@/components/MapClickMarker'; 
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Link from 'next/link';
// 🔽 検索フォーム用に TextField と Button をインポート
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button'; 

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

// --- 🔽 検索結果の型定義 🔽 ---
type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};
// --- 🔼 追加ここまで 🔼 ---

// =========================================================
// イベント投稿ページのメインコンポーネント
// =========================================================
export default function PostEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventstartDay: '',
    eventfinishDay: '',
    latitude: null as number | null, 
    longitude: null as number | null,
    image: null as File | null, 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [navValue, setNavValue] = useState(2); 
  const navHeight = 64; 

  // --- 🔽 地図の中心と検索用のステートを追加 🔽 ---
  const [mapCenter, setMapCenter] = useState<LatLngTuple | null>(null); // 地図の中心
  const [searchQuery, setSearchQuery] = useState(''); // 検索クエリ
  const [isSearching, setIsSearching] = useState(false); // 検索中フラグ
  // --- 🔼 追加ここまで 🔼 ---


  const currentPosition: LatLngTuple | null = 
    (formData.latitude !== null && formData.longitude !== null) 
    ? [formData.latitude, formData.longitude] 
    : null;

  // --- 🔽 ステップ2の時に現在地を取得するロジック 🔽 ---
  useEffect(() => {
    // ステップ2（地図表示）の時だけ実行
    if (step === 2 && mapCenter === null) {
      // 1. ピンがすでにあればそこを中央に
      if (currentPosition) {
        setMapCenter(currentPosition);
      } 
      // 2. ピンがなければ現在地を取得
      else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            setMapCenter([lat, lng]); // 1. 地図を現在地に移動
            
            // 🔽 2. 現在地に自動でピンを刺す (これが足りなかった)
            handleMapPositionChange(lat, lng); 
            // 🔼 --- 修正ここまで --- 🔼
          },
          (err) => {
            console.warn("現在地の取得に失敗:", err);
            setMapCenter([35.681236, 139.767125]); 
          }
        );
      }
      // 3. Geolocation非対応なら東京駅
      else {
        console.warn("Geolocation非対応");
        setMapCenter([35.681236, 139.767125]);
      }
    }
  }, [step, currentPosition, mapCenter]); // 👈 step, currentPosition, mapCenter に依存
  // --- 🔼 追加ここまで 🔼 ---


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
    if (file) { setFormData(prev => ({ ...prev, image: file })); }
    else { setFormData(prev => ({ ...prev, image: null })); }
  };
  const handleRemoveImage = useCallback(() => {
    setFormData(prev => ({ ...prev, image: null }));
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) { fileInput.value = ""; }
  }, []);

  // --- 🔽 場所検索ハンドラを追加 🔽 ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      // Nominatim (OpenStreetMapの無料ジオコーディングAPI) を使います
      // ※注意: APIの利用規約に従い、短時間に大量のリクエストを送らないでください
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        limit: '1'
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const results: NominatimResult[] = await response.json();

      if (results.length > 0) {
        const firstResult = results[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);
        // 地図の中心を検索結果に移動
        setMapCenter([lat, lng]); 
        // ピンもそこに移動（ユーザーが微調整できるように）
        handleMapPositionChange(lat, lng); 
      } else {
        alert('場所が見つかりませんでした。');
      }

    } catch (error) {
      console.error("検索エラー:", error);
      alert('場所の検索中にエラーが発生しました。');
    } finally {
      setIsSearching(false);
    }
  };
  // --- 🔼 追加ここまで 🔼 ---

  // ... (handleSubmit は変更なし) ...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // 必須項目をチェック (description は任意なので除外)
    if (!formData.title || !formData.latitude || !formData.longitude || !formData.eventstartDay || !formData.eventfinishDay) {
        alert("必須項目（タイトル、開始日、終了日、場所）が入力されていません。");
        
        // どのステップに戻るか判定
        if (!formData.title || !formData.eventstartDay || !formData.eventfinishDay) {
          setStep(1);
        } else if (!formData.latitude) {
          setStep(2);
        }
        return;
    }

    setIsLoading(true);
    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    dataToSend.append('description', formData.description || ''); // 任意項目
    dataToSend.append('eventstartDay', formData.eventstartDay);
    dataToSend.append('eventfinishDay', formData.eventfinishDay);
    dataToSend.append('latitude', String(formData.latitude));
    dataToSend.append('longitude', String(formData.longitude));
    if (formData.image) {
      dataToSend.append('image', formData.image);
    }
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        body: dataToSend, 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '投稿に失敗しました');
      }
      alert('イベントを投稿しました！ホーム画面に戻ります。');
      setFormData({
          title: '', description: '', eventstartDay: '', eventfinishDay: '',
          latitude: null, longitude: null, image: null,
      });
      router.push('/');
    } catch (error) {
      console.error('送信エラー:', error);
      if (error instanceof Error) {
        alert(`エラー: ${error.message}`);
      } else {
        alert('投稿中に不明なエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ pb: `${navHeight}px`, minHeight: '100vh', bgcolor: 'grey.100' }}>
      
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
          
          {/* --- ステップ 1: イベント情報入力 (変更なし) ---  */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              {/* ... (内容は変更なし) ... */}
              <h1 className="text-3xl font-bold mb-6 text-gray-800">イベント情報入力</h1>
              {/* title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">イベント名</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleFormChange} placeholder="例: ハッカソン 2025" required className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              {/* eventstartDay */}
              <div>
                <label htmlFor="eventstartDay" className="block text-sm font-medium text-gray-700">イベント開始日</label>
                <input type="date" name="eventstartDay" id="eventstartDay" value={formData.eventstartDay} onChange={handleFormChange} required className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              {/* eventfinishDay */}
              <div className="mb-4">
                <label htmlFor="eventfinishDay" className="block text-sm font-medium text-gray-700">イベント終了日</label>
                <input type="date" name="eventfinishDay" id="eventfinishDay" value={formData.eventfinishDay} onChange={handleFormChange} required className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              {/* description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">詳細</label>
                <textarea 
                  name="description" 
                  id="description" 
                  rows={4} 
                  value={formData.description} 
                  onChange={handleFormChange} 
                  placeholder="例: 有意義な時間を過ごすことができました。(任意)" 
                  className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  // required を削除
                />
              </div>
              <button type="submit" className="w-full py-3 px-4 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                次へ (場所を選択)
              </button>
            </form>
          )}

          {/* --- 🔽 ステップ 2: 地図で場所を選択 (修正) 🔽 --- */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">開催場所を選択</h1>

              {/* --- 検索フォームを追加 --- */}
              <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="場所名や住所で検索"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isSearching}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSearching || !searchQuery.trim()}
                  sx={{ px: 3 }}
                >
                  {isSearching ? '検索中...' : '検索'}
                </Button>
              </Box>
              {/* --- 追加ここまで --- */}

              <p className="text-sm text-gray-600 mb-4">地図をクリックしてピンを配置してください。</p>
              
              <div style={{ height: '400px', width: '100%' }} className="rounded-md overflow-hidden border border-gray-300">
                {/* 🔽 mapCenter が null の間はローディング表示 🔽 */}
                {!mapCenter ? (
                  <p className="text-gray-500">現在地を取得中...</p>
                ) : (
                  <DynamicClickableMap 
                    onPositionChange={handleMapPositionChange} 
                    currentPosition={currentPosition}
                    center={mapCenter} // 👈 取得した mapCenter を渡す
                  />
                )}
                {/* 🔼 修正ここまで 🔼 */}
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
          {/* 🔼 --- 修正ここまで --- 🔼 */}

          {/* --- ステップ 3: 写真追加 (変更なし) ---  */}
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

          {/* --- ステップ 4: プレビュー・投稿確認 (変更なし) --- */}
          {step === 4 && (
            <form onSubmit={handleSubmit}>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">投稿プレビュー</h1>
              
              {formData.image ? (
                <div className="mb-4 border rounded-lg overflow-hidden">
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

      {/* --- Bottom navigation (変更なし) --- */}
      <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1200 }}>
        <Paper elevation={8} sx={{ position: "relative" }}>
          <BottomNavigation
            showLabels
            value={navValue} 
            onChange={(event, newValue) => {
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

    </Box>
  );
}