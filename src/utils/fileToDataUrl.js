/**
 * Converts an uploaded File object into a base64 data URL.
 *
 * Why data URLs and not object URLs (URL.createObjectURL)?
 * Canvas export (stage.toDataURL()) will throw a "tainted canvas" security
 * error if any image drawn on it isn't same-origin. Object URLs are treated
 * as foreign by some browsers/extensions in edge cases, but base64 data URLs
 * are always safe for canvas export because the pixel data is embedded
 * directly in the string. Slightly heavier in memory, but for ~10-15 avatar
 * images on an internal tool this is a non-issue.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/** Quick guard so we don't try to load something that isn't an image. */
export function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/')
}
