"use client";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface AvatarLightboxProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  username: string;
}

/**
 * Fullscreen avatar viewer — reuses the already-installed lightbox's `Zoom`
 * plugin (wheel/pinch/double-click zoom + drag-to-pan when zoomed) instead of
 * porting legacy `profile-avatar-modal.js`'s bespoke pointer-event handling.
 */
export function AvatarLightbox({ open, onClose, imageUrl, username }: AvatarLightboxProps) {
  if (!imageUrl) return null;

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src: imageUrl, alt: username }]}
      plugins={[Zoom]}
      zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true, doubleTapDelay: 300 }}
      carousel={{ finite: true }}
      render={{ buttonPrev: () => null, buttonNext: () => null }}
    />
  );
}
