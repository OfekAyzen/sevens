/**
 * Downscale an image to a data URL before it enters a member document.
 *
 * Member documents sync as JSON and every phone pulls all four of them, so a
 * handful of full-resolution photos would make the whole group's sync slow and
 * eventually fail. 900px on the long edge at quality 0.7 keeps a week of posts
 * comfortably small while still being clearly legible on a phone.
 */
export async function downscaleImage(file: File, maxEdge = 900, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', quality);
}
