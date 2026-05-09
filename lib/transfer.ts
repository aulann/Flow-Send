export const CHUNK_SIZE = 64 * 1024 // 64 KB
export const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1 GB — receiver buffers chunks in RAM until file-end

export async function* chunkFile(file: File): AsyncGenerator<ArrayBuffer> {
  let offset = 0
  while (offset < file.size) {
    yield await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer()
    offset += CHUNK_SIZE
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function mimeToSubtype(mime: string): "image" | "video" | "file" {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  return "file"
}
