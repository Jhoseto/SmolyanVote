/**
 * Reads an audio file's duration client-side (via a throwaway `<audio>`
 * element) so admins never have to type it in manually when uploading a new
 * episode. Resolves `null` on unsupported/corrupt files instead of throwing —
 * duration is a nice-to-have, not a blocker for publishing.
 */
export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    function cleanup() {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      URL.revokeObjectURL(url);
    }

    function onLoaded() {
      const seconds = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
      cleanup();
      resolve(seconds);
    }

    function onError() {
      cleanup();
      resolve(null);
    }

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.src = url;
  });
}
