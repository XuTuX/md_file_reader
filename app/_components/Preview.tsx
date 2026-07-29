"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { Settings } from "../_lib/settings";
import type { SelectionRect } from "../_features/document/types";
import {
  isPreviewToParentMessage,
  postToPreview,
} from "../_features/preview/previewMessages";

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

  useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);

  const sendSettings = useCallback(() => {
    if (settings && iframeRef.current?.contentWindow) {
      postToPreview(iframeRef.current, {
        type: "markdown-document:updateSettings",
        settings: {
          docTitle: settings.docTitle,
          maxWidth: settings.maxWidth,
          fontSize: settings.fontSize,
          showToc: settings.showToc,
          showProgress: settings.showProgress,
          showPrintButton: settings.showPrintButton,
        },
      });
    }
  }, [settings]);

  /* 설정/제목 변경 시 iframe 재로드 없이 postMessage 로 라이브 DOM/CSS 변수 업데이트 */
  useEffect(() => sendSettings(), [sendSettings]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isPreviewToParentMessage(event.data)) return;
      if (event.data.type === "markdown-document:ready") {
        sendSettings();
        return;
      }
      if (event.data.type === "markdown-document:selection") {
        if (!onSelectText) return;
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
  }, [onSelectText, sendSettings]);

  return (
    <iframe
      ref={iframeRef}
      title={`${title} 미리보기`}
      srcDoc={html}
      onLoad={sendSettings}
      // allow-same-origin 을 주지 않아 미리보기 문서가 앱의 origin 에 접근하지 못한다.
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
      allow="clipboard-write"
      className={className ?? "h-full w-full border-0 bg-white"}
    />
  );
});

export default Preview;
