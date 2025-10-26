"use client";
//イベント名：title
//場所：location
//説明：explanation
//写真：
import { useState } from "react";
import dynamic from "next/dynamic";

import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

export default function EventFormPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    explanation: "",
    image: null as File | null,
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md mt-8">
      {/* Step 1: イベント情報 */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">イベント情報</h2>

          <label className="block mb-3">
            <span className="text-gray-700">イベント名</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded-md mt-1"
              placeholder="例：文化祭2025"
            />
          </label>

          <label className="block mb-3">
            <span className="text-gray-700">場所</span>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border rounded-md mt-1"
              placeholder="例：東京ビッグサイト"
            />
          </label>

          <label className="block mb-3">
            <span className="text-gray-700">説明</span>
            <input
              type="text"
              value={formData.explanation ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              className="w-full p-2 border rounded-md mt-1"
              placeholder="例：活気にあふれていました！"
            />
          </label>

          <button
            onClick={handleNext}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            次へ →
          </button>
        </div>
      )}

      {/* Step 2: 写真追加 */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">写真を追加</h2>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.files?.[0] || null })
            }
            className="block w-full text-sm text-gray-700 border rounded-md p-2"
          />
          {formData.image && (
            <img
              src={URL.createObjectURL(formData.image)}
              alt="プレビュー"
              className="mt-4 rounded-md shadow-sm"
            />
          )}
          <div className="flex justify-between mt-4">
            <button
              onClick={handleBack}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            >
              ← 戻る
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: プレビュー・投稿確認 */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">プレビュー</h2>

          {/* ユーザー情報 */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-semibold">U</span>
            </div>
            <div className="ml-3">
              <p className="text-gray-800 font-medium">ユーザー名（仮）</p>
              <p className="text-gray-500 text-sm">
                {new Date().toLocaleDateString("ja-JP")}
              </p>
            </div>
          </div>

          {/* 投稿画像 or 白枠 */}
          <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
            {formData.image ? (
              <img
                src={URL.createObjectURL(formData.image)}
                alt="投稿画像"
                className="object-cover w-full h-full"
              />
            ) : (
              <p className="text-gray-400">写真が選択されていません</p>
            )}
          </div>

          {/* イベント情報 */}
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-gray-800">
              {formData.title || "（イベント名未入力）"}
            </p>
            <div className="flex items-center text-gray-600">
              {/* 場所にピンの画像 */}
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-1 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11c.828 0 1.5-.672 1.5-1.5S12.828 8 12 8s-1.5.672-1.5 1.5S11.172 11 12 11zm0 0v8.25m0 0l4.5-4.5m-4.5 4.5l-4.5-4.5"
                />
              </svg> */}
              <span>{formData.location || "（場所未入力）"}</span>
            </div>

            <p className="text-gray-700 mt-2 whitespace-pre-line">
              {formData.explanation || "（説明が入力されていません）"}
            </p>
          </div>

          {/* ボタン */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            >
              ← 戻る
            </button>
            <button
              onClick={() => alert("投稿しました！（仮）")}
              className="bg-green-600 text-white px-4 py-2 rounded-md"
            >
              投稿する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}