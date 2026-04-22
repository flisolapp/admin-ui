import { Injectable } from '@angular/core';
import { EditionRecord } from '../edition/edition-service';
import { QrCodeService } from '../qr-code/qr-code.service';

export interface LabelRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  edition?: EditionRecord;
  qrCode?: string;
  info?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class LabelService {
  public constructor(private readonly qrCodeService: QrCodeService) {}

  public splitName(fullName?: string | null): { firstName: string; lastName: string } {
    if (!fullName || !fullName.trim()) {
      return { firstName: '', lastName: '' };
    }

    // Normalize spaces
    const normalized = fullName.trim().replace(/\s+/g, ' ');

    const parts = normalized.split(' ');

    // First name = first token (max 14 chars)
    const firstName = (parts[0] ?? '').slice(0, 14);

    // Last name = last token (max 14 chars)
    const lastName = parts.length > 1 ? parts[parts.length - 1].slice(0, 14) : '';

    return { firstName, lastName };
  }

  public async generate(label: LabelRecord): Promise<Blob | null> {
    if (typeof document === 'undefined') {
      return null;
    }

    // 6 cm x 4 cm label
    // Using a 3:2 canvas close to the provided reference
    const width = 720;
    const height = 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    // Background
    // ctx.fillStyle = '#f3f3f3';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Improve text rendering
    ctx.textBaseline = 'top';
    ctx.imageSmoothingEnabled = false;

    const firstName = (label.firstName ?? '').trim();
    const lastName = (label.lastName ?? '').trim();
    const edition = (label.edition?.label ?? '').trim();
    const qrText = (label.qrCode ?? '').trim();
    const info = (label.info ?? '').trim();

    // Layout reference areas
    const leftX = 28;
    const topY = 24;
    const qrSize = 280;
    const qrX = 430;
    const qrY = 200;

    // First name
    // this.drawFittedMonoText(ctx, firstName, leftX, topY, 360, 92, 78, 42, 900);
    this.drawFittedMonoText(ctx, firstName, leftX, topY, 720, 92, 78, 42, 900);

    // Last name
    // this.drawFittedMonoText(ctx, lastName, leftX, 150, 320, 62, 56, 28, 500);
    this.drawFittedMonoText(ctx, lastName, leftX, 110, 720, 92, 78, 42, 500);

    // Edition
    this.drawFittedMonoText(ctx, edition, leftX, 224, 280, 52, 50, 24, 500);

    // // Small id at bottom-left
    // if (label.id) {
    //   ctx.fillStyle = '#000000';
    //   ctx.font = '400 18px "Roboto Mono", "Courier New", monospace';
    //   ctx.fillText(`#${label.id}`, leftX, 404);
    // }

    // QR Code
    if (qrText) {
      const qrCanvas = document.createElement('canvas');
      this.qrCodeService.draw(qrCanvas, qrText);

      // Draw QR into target size
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    }

    // Vertical info text on right side
    if (info) {
      ctx.save();
      ctx.translate(width - 30, height - 30);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#000000';
      ctx.font = '400 22px "Roboto Mono", "Courier New", monospace';
      ctx.fillText(info, 0, 0);
      ctx.restore();
    }

    // Export PNG blob
    const dataUrl = canvas.toDataURL('image/png');
    return this.dataUrlToBlob(dataUrl);
  }

  private drawFittedMonoText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    startFontSize: number,
    minFontSize: number,
    fontWeight: number = 400,
  ): void {
    if (!text) {
      return;
    }

    let fontSize = startFontSize;

    while (fontSize >= minFontSize) {
      ctx.font = `${fontWeight} ${fontSize}px "Roboto Mono", "Courier New", monospace`;
      const metrics = ctx.measureText(text);

      if (metrics.width <= maxWidth) {
        break;
      }

      fontSize -= 1;
    }

    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y, maxWidth);
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';

    const binary = atob(parts[1]);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  }

  public async rotateClockwise(blob: Blob): Promise<Blob> {
    const imageBitmap = await createImageBitmap(blob);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Swap width/height because of rotation
    canvas.width = imageBitmap.height;
    canvas.height = imageBitmap.width;

    // Move origin to center for rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Rotate 90° clockwise
    ctx.rotate(Math.PI / 2);

    // Draw image centered
    ctx.drawImage(imageBitmap, -imageBitmap.width / 2, -imageBitmap.height / 2);

    // Export as Blob
    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), blob.type);
    });
  }
}
