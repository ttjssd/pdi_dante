"use client";

import { useEffect, useState } from "react";
import type { GuideImage as GuideImageData } from "./guideData";

export default function GuideImage({ image }: { image: GuideImageData }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  // 이미지가 없거나 손상된 섹션은 빈 프레임 없이 텍스트만 표시합니다.
  if (failed) return null;

  return (
    <>
      <figure className="guide-image-card">
        <button
          className="guide-image-button"
          type="button"
          onClick={() => !failed && setOpen(true)}
          aria-label={`${image.caption} 크게 보기`}
        >
          <img src={image.src} alt={image.alt} onError={() => setFailed(true)} />
          <span className="guide-image-expand">확대 보기 ↗</span>
        </button>
        <figcaption>{image.caption}</figcaption>
      </figure>

      {open && (
        <div className="guide-lightbox" role="dialog" aria-modal="true" aria-label={image.caption} onClick={() => setOpen(false)}>
          <button type="button" onClick={() => setOpen(false)} aria-label="확대 이미지 닫기">×</button>
          <img src={image.src} alt={image.alt} onClick={(event) => event.stopPropagation()} />
          <p>{image.caption}</p>
        </div>
      )}
    </>
  );
}
