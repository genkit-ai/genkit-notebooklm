import axios from "axios";
import pdfParse from "pdf-parse";
import path from "path";
import mammoth from "mammoth"; // For .docx
import { storage } from './config';

export async function uploadFileToStorage(bucket: any, filePath: string, destination: string) {
  await bucket.upload(filePath, {
    destination,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  console.log(`${filePath} uploaded to ${destination}`);
  return `gs://${bucket.name}/${destination}`;
}

/**
 * This function retrieves text content from a given URL. It supports both Google Cloud Storage URLs (gs://) and regular URLs.
 * 
 * 1. If the URL starts with "gs://", it handles it as a Google Cloud Storage URL:
 *    - Extracts the bucket name and file path from the URL.
 *    - Downloads the file from the specified Google Cloud Storage bucket.
 * 
 * 2. If the URL is a regular URL:
 *    - Fetches the file from the URL.
 *    - Converts the response to a buffer.
 * 
 * 3. Determines the content type and file extension to decide how to process the file:
 *    - For PDF files (content type includes "pdf" or extension is ".pdf"):
 *      - Uses pdf-parse to extract text content from the PDF buffer.
 *    - For plain text files (content type includes "plain" or extension is ".txt"):
 *      - Converts the buffer to a UTF-8 string.
 *    - For Word documents (content type includes "word" or extension is ".docx"):
 *      - Uses mammoth to extract raw text from the Word document buffer.
 *    - For Markdown files (extension is ".md"):
 *      - Converts the buffer to a UTF-8 string.
 * 
 * 4. Returns an object containing:
 *    - isText: A boolean indicating whether the file was successfully processed as text.
 *    - content: The extracted text content.
 * 
 * If any errors occur during the process, they are logged and re-thrown.
 */
export async function getTextFromUrl(url: string): Promise<{ isText: boolean, content: string }> {
  try {
    let buffer: Buffer;
    let contentType = "";

    if (url.startsWith("gs://")) {
      // Handle Google Cloud Storage URL
      if (!storage) {
        throw new Error("Storage is not defined. Cannot access Google Cloud Storage.");
      }
      const bucketName = url.split('/')[2];
      const filePath = url.split('/').slice(3).join('/');
      const file = storage.bucket(bucketName).file(filePath);
      const [fileBuffer] = await file.download();
      const [metadata] = await file.getMetadata();
      contentType = metadata.contentType || "";
      buffer = fileBuffer;
    } else {
      // Handle regular URL
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': '*/*'
        }
      });
      contentType = response.headers['content-type'] || "";
      buffer = Buffer.from(response.data);
    }

    const extension = path.extname(url).toLowerCase();

    let text = "";
    let isText = false;

    if (contentType.includes("pdf") || extension === ".pdf") {
      const data = await pdfParse(buffer);
      text = data.text;
      isText = true;
    } else if (contentType.includes("plain") || extension === ".txt") {
      text = buffer.toString("utf-8");
      isText = true;
    } else if (contentType.includes("word") || extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      isText = true;
    } else if (extension === ".md") {
      text = buffer.toString("utf-8");
      isText = true;
    }

    return { isText, content: text };
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}

export function isUrl(text: string): boolean {
  const trimmed = text.trim();
  // Check for spaces
  if (trimmed.includes(' ')) {
    return false;
  }

  // Check for Google Cloud Storage URLs
  if (trimmed.startsWith('gs://')) {
    // Basic GCS URL format validation: gs://bucket-name/path
    const parts = trimmed.split('/');
    return parts.length >= 3 && parts[2].length > 0;
  }

  // Check for standard URLs
  try {
    new URL(trimmed);
    return true;
  } catch (_) {
    return false;
  }
}
