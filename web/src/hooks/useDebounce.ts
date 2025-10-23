import { useEffect, useState } from "react";

/**
 * 値の変更をデバウンスするカスタムフック
 * @param value - デバウンスする値
 * @param delay - 遅延時間(ミリ秒)
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 指定された遅延時間後に値を更新するタイマーを設定
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 値が変更されたらタイマーをクリア(クリーンアップ)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
