"use client";

import { useEffect, useState } from "react";
import { decryptFromPeer, isE2ECiphertext } from "../lib/e2eCrypto";
import { usePeerE2EKey } from "../hooks/useE2EKeys";

/**
 * Decrypts an E2E payload for display. Optimistic own bubbles already carry
 * plaintext (no prefix), so they pass through; server echoes are ciphertext
 * and get decrypted with the peer's public key.
 */
export function useDecryptedText(
  text: string,
  peerUserId: number | null | undefined,
): { display: string; locked: boolean; encrypted: boolean } {
  const encrypted = isE2ECiphertext(text);
  const { data: peerKey } = usePeerE2EKey(encrypted ? peerUserId : null);
  const [display, setDisplay] = useState(encrypted ? "🔒 Криптирано съобщение…" : text);
  const [locked, setLocked] = useState(encrypted);

  useEffect(() => {
    if (!encrypted) {
      setDisplay(text);
      setLocked(false);
      return;
    }
    if (!peerKey?.publicJwk) {
      setDisplay("🔒 Криптирано съобщение…");
      setLocked(true);
      return;
    }

    let cancelled = false;
    void decryptFromPeer(text, peerKey.publicJwk).then((plain) => {
      if (cancelled) return;
      if (plain == null) {
        setDisplay("🔒 Не може да се декриптира");
        setLocked(true);
      } else {
        setDisplay(plain);
        setLocked(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text, encrypted, peerKey?.publicJwk]);

  return { display, locked, encrypted };
}
