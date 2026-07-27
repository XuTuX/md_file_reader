"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Settings } from "../_lib/settings";

interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  html: string;
  settings?: Settings;
  title: string;
  className?: string;
  onSelectText?: (text: string, rect: SelectionRect | null) => void;
}

/**
 * 변환 결과를 sandbox iframe 으로 보여준다.
 * 설정(제목, 폭, 글자 크기 등) 변경 시에는 iframe 을 재로드하지 않고 postMessage 로
 * 실시간 반영하여 화면 깜빡임을 100% 방지합니다.
 */
const Preview = forwardRef<HTMLIFrameElement, Props>(function Preview(
  { html, settings, title, className, onSelectText },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState(html);
  const lastSettingsRef = useRef<Settings | undefined>(settings);

  useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);

  /* 설정/제목 변경 시 iframe 재로드 없이 postMessage 로 라이브 DOM/CSS 변수 업데이트 */
  useEffect(() => {
    if (settings && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "md2notion:updateSettings",
          settings: {
            docTitle: settings.docTitle,
            maxWidth: settings.maxWidth,
            fontSize: settings.fontSize,
            showToc: settings.showToc,
            showProgress: settings.showProgress,
            showPrintButton: settings.showPrintButton,
          },
        },
        "*",
      );
    }
  }, [settings]);

  /*
   * 마크다운 본문 변경 시에만 srcDoc 을 갱신하고,
   * 순수 설정/제목 변경 시에는 postMessage 가 처리하므로 srcDoc 재초기화(깜빡임)를 스킵합니다.
   */
  useEffect(() => {
    const settingsChanged =
      lastSettingsRef.current &&
      settings &&
      (lastSettingsRef.current.docTitle !== settings.docTitle ||
        lastSettingsRef.current.maxWidth !== settings.maxWidth ||
        lastSettingsRef.current.fontSize !== settings.fontSize ||
        lastSettingsRef.current.showToc !== settings.showToc ||
        lastSettingsRef.current.showProgress !== settings.showProgress ||
        lastSettingsRef.current.showPrintButton !== settings.showPrintButton);

    lastSettingsRef.current = settings;

    // 순수 설정 변경인 경우 srcDoc 을 갱신하여 iframe 을 재로드하지 않는다 (깜빡임 완전 제거)
    if (settingsChanged && iframeRef.current?.contentWindow) {
      return;
    }

    setSrcDoc(html);
  }, [html, settings]);

  useEffect(() => {
    if (!onSelectText) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "md2notion:selection") {
        const text = event.data.text;
        const rect = event.data.rect;

        if (!text || !rect) {
          onSelectText("", null);
          return;
        }

        // iframe의 뷰포트 상대 위치를 더해 메인 윈도우 좌표로 변환
        const iframeBounds = iframeRef.current?.getBoundingClientRect();
        if (!iframeBounds) return;

        const absoluteRect: SelectionRect = {
          top: iframeBounds.top + rect.top,
          left: iframeBounds.left + rect.left,
          width: rect.width,
          height: rect.height,
        };

        onSelectText(text, absoluteRect);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectText]);

  return (
    <iframe
      ref={iframeRef}
      title={`${title} 미리보기`}
      srcDoc={srcDoc}
      // allow-same-origin 을 주지 않아 미리보기 문서가 앱의 origin 에 접근하지 못한다.
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
      allow="clipboard-write"
      className={className ?? "h-full w-full border-0 bg-white"}
    />
  );
});

export default Preview;
