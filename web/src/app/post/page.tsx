"use client";

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback } from 'react';
import type { LatLngTuple } from 'leaflet'; 
import type { MapClickMarkerProps } from '@/components/MapClickMarker'; 

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
  
  // 1. ステップ管理用のステート
  const [step, setStep] = useState(1);

  // 2. フォームデータを一元管理（imageを追加）
  const [formData, setFormData] = useState({
    title: '',
    description: '',
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

  // =========================================================
  // --- 最終送信ハンドラ (API呼び出し) ---
  // =========================================================
  const handleSubmit = async (e: React.FormEvent) => { // 👈 async を追加
    e.preventDefault();

    // 既に読み込み中なら何もしない
    if (isLoading) return;

    // フォームバリデーション（handleSubmit内でも行うと安全）
    if (!formData.title || !formData.description || !formData.latitude || !formData.longitude) {
        alert("必須項目（タイトル、詳細、場所）が入力されていません。");
        // エラーが発生したステップに戻す（任意）
        // if (!formData.title || !formData.description) setStep(1);
        // else if (!formData.latitude) setStep(2);
        return;
    }

    // 読み込み開始
    setIsLoading(true);

    // 1. APIに送信するデータ（画像以外）を準備
    const dataToSend = {
      title: formData.title,
      description: formData.description,
      latitude: formData.latitude,
      longitude: formData.longitude,
      // ⚠️ 画像はまだ送信していません
      // imageUrl: null (API側で処理される想定)
    };

    try {
      // 2. APIエンドポイントにデータをPOSTで送信
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
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
          title: '', description: '', latitude: null, longitude: null, image: null,
      });
      setStep(1);

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
        
        {/* --- ステップ 1: イベント情報入力 --- (変更なし) */}
        {step === 1 && (
          <form onSubmit={handleNext}>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">イベント情報入力</h1>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">イベント名</label>
              <input
                type="text" name="title" id="title"
                value={formData.title} onChange={handleFormChange}
                placeholder="例: 社内ハッカソン 2025" required
                className="mt-1 block w-full border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">詳細</label>
              <textarea
                name="description" id="description" rows={4}
                value={formData.description} onChange={handleFormChange}
                placeholder="イベントの目的、日時、参加対象などを詳しく記述" required
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

        {/* --- ステップ 2: 地図で場所を選択 --- (変更なし) */}
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

        {/* --- ステップ 3: 写真追加 --- (変更なし) */}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">写真を追加</h1>
            <p className="text-sm text-gray-600 mb-4">イベントのメイン画像を選択してください（任意）。</p>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-indigo-50 file:text-indigo-700
                         hover:file:bg-indigo-100"
            />
            
            {formData.image && (
              <div className="mt-6 border rounded-lg overflow-hidden">
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