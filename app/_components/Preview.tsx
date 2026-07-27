"use client";

import { forwardRef } from "react";

interface Props {
  html: string;
  title: string;
  className?: string;
}

/**
 * 변환 결과를 sandbox iframe 으로 보여준다.
 * 여기에 들어가는 HTML 은 다운로드되는 파일과 완전히 동일하므로,
 * 미리보기에서 보이는 것이 곧 최종 결과물이다.
 */
const Preview = forwardRef<HTMLIFrameElement, Props>(function Preview(
  { html, title, className },
  ref,
) {
  return (
    <iframe
      ref={ref}
      title={`${title} 미리보기`}
      srcDoc={html}
      // allow-same-origin 을 주지 않아 미리보기 문서가 앱의 origin 에 접근하지 못한다.
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
      allow="clipboard-write"
      className={className ?? "h-full w-full border-0 bg-white"}
    />
  );
});

export default Preview;
