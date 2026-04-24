// utils/pdfToImage.ts
import { Platform } from 'react-native';

// For web - using pdf.js
export async function pdfToImageWeb(pdfUrl: string): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  
  const pdf = await pdfjs.getDocument(pdfUrl).promise;
  const page = await pdf.getPage(1); // First page only
  
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context!,
    viewport: viewport,
  }).promise;
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

// For mobile - using react-native-pdf
export async function pdfToImageMobile(pdfUrl: string): Promise<string> {
  const RNFS = require('react-native-fs');
  
  // This would need more implementation with react-native-pdf
  // For now, we'll return a placeholder or use the PDF URL directly
  return pdfUrl;
}

// Main function
export async function pdfToImage(pdfUrl: string): Promise<string> {
  if (Platform.OS === 'web') {
    return pdfToImageWeb(pdfUrl);
  } else {
    return pdfToImageMobile(pdfUrl);
  }
}