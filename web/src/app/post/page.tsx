"use client";

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback } from 'react';
import type { LatLngTuple } from 'leaflet'; 
import type { MapClickMarkerProps } from '@/components/MapClickMarker'; 
import { useRouter } from 'next/navigation';

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

  // フォームデータから現在のLatLngTupleを作成
  const currentPosition: LatLngTuple | null = 
    (formData.latitude !== null && formData.longitude !== null) 
    ? [formData.latitude, formData.longitude] 
    : null;

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
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
        
        {/* --- ステップ 1: イベント情報入力 ---  */}
        {step === 1 && (
          <form onSubmit={handleNext}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">イベント情報入力</h1>
            
            {/* title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">イベント名</label>
              <input
                type="text" name="title" id="title"
                value={formData.title} onChange={handleFormChange}
                placeholder="例: ハッカソン 2025" required
                className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* eventstartDay */}
            <div>
              <label htmlFor="eventstartDay" className="block text-sm font-medium text-gray-700">イベント開始日</label>
              <input
                type="date"
                name="eventstartDay"
                id="eventstartDay"
                value={formData.eventstartDay}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* eventfinishDay */}
            <div className="mb-4">
              <label htmlFor="eventfinishDay" className="block text-sm font-medium text-gray-700">イベント終了日</label>
              <input
                type="date" 
                name="eventfinishDay"
                id="eventfinishDay"
                value={formData.eventfinishDay}
                onChange={handleFormChange} 
                required
                className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">詳細</label>
              <textarea
                name="description" id="description" rows={4}
                value={formData.description} onChange={handleFormChange}
                placeholder="例: 有意義な時間を過ごすことができました。"
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
              <DynamicClickableMap 
                onPositionChange={handleMapPositionChange} 
                currentPosition={currentPosition}
              />
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

        {/* --- ステップ 4: プレビュー・投稿確認 --- (ボタンを修正) */}
        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">投稿プレビュー</h1>
            
            {/* 画像プレビュー */}
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

            {/* テキスト情報 */}
            <div className="mb-4 space-y-2">
              <h2 className="text-2xl font-semibold">{formData.title}</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
            </div>

            {/* 地図プレビュー (読み取り専用) */}
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
  );
}