import { Injectable } from '@angular/core';
import {
  ImageEncoder,
  NiimbotBluetoothClient,
  NiimbotSerialClient,
  RequestCommandId,
  ResponseCommandId,
  Utils,
} from '@mmote/niimbluelib';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';
export type ConnectionType = 'bluetooth' | 'serial' | 'capacitor-ble';

// Reference: https://github.com/MultiMote/niimbluelib/blob/main/example/main.js

@Injectable({
  providedIn: 'root',
})
export class LabelPrinterService {
  private client: NiimbotBluetoothClient | NiimbotSerialClient | null = null;

  private logger(text: any): void {
    console.log(text);
    // logPane.innerText += text + '\n';
    // logPane.scrollTop = logPane.scrollHeight;
  }

  private toError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string' && error.trim()) {
      return new Error(error);
    }

    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error(fallbackMessage);
    }
  }

  /** Instantiate client */
  private newClient(transport: any): void {
    if (this.client) {
      this.client.disconnect();
    }

    if (transport === 'ble') {
      this.client = new NiimbotBluetoothClient();
    } else if (transport === 'serial') {
      this.client = new NiimbotSerialClient();
    } else {
      throw new Error(`Unsupported transport: ${transport}`);
    }

    this.client.on('packetsent', (e) => {
      this.logger(
        `>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`,
      );
    });

    this.client.on('packetreceived', (e) => {
      this.logger(
        `<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`,
      );
    });

    this.client.on('connect', () => {
      this.logger('connected');
      // disconnectButton.disabled = false;
      // printButton.disabled = false;
      // bleConnectButton.disabled = true;
      // serialConnectButton.disabled = true;
    });

    this.client.on('disconnect', () => {
      this.logger('disconnected');
      // disconnectButton.disabled = true;
      // printButton.disabled = true;
      // bleConnectButton.disabled = false;
      // serialConnectButton.disabled = false;
    });

    this.client.on('printprogress', (e) => {
      this.logger(
        `Page ${e.page}/${e.pagesTotal}, Page print ${e.pagePrintProgress}%, Page feed ${e.pageFeedProgress}%`,
      );
    });
  }

  public async connect(): Promise<void> {
    this.newClient('serial');

    if (!this.client) {
      throw new Error('Printer client was not initialized');
    }

    try {
      await this.client.connect();
    } catch (error: unknown) {
      this.logger(error);
      throw this.toError(error, 'Failed to connect to printer');
    }
  }

  public disconnect(): void {
    this.client?.disconnect();
    this.client = null;
  }

  // /** On "Connect BLE" clicked */
  // bleConnectButton.onclick = async () => {
  //   newClient("ble");
  //
  //   try {
  //     await client.connect();
  //   } catch (e) {
  //     alert(e);
  //   }
  // };

  // /** On "Connect Serial" clicked */
  // serialConnectButton.onclick = async () => {
  //   newClient("serial");
  //
  //   try {
  //     await client.connect();
  //   } catch (e) {
  //     alert(e);
  //   }
  // };

  public async printBlob(blob: Blob): Promise<void> {
    try {
      const imageBitmap = await createImageBitmap(blob);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Swap width/height because of rotation
      canvas.width = imageBitmap.height;
      canvas.height = imageBitmap.width;

      // Draw image centered
      ctx.drawImage(imageBitmap, 0, 0);

      await this.printCanvas(canvas);
    } catch (error: unknown) {
      this.logger(error);
      throw this.toError(error, 'Failed to prepare image for printing');
    }
  }

  public async printCanvas(canvas: HTMLCanvasElement): Promise<void> {
    if (!this.client) {
      throw new Error('Printer is not connected');
    }

    /** left or top */
    const printDirection = 'top';
    const quantity = 1;

    /** Convert image to black and white bits */
    const encoded = ImageEncoder.encodeCanvas(canvas, printDirection);

    /** todo: Auto-detection works only for a small set of printers so manual user selection is required */
    const printTaskName = this.client.getPrintTaskType() ?? 'B1';

    const printTask = this.client.abstraction.newPrintTask(printTaskName, {
      totalPages: quantity,
      statusPollIntervalMs: 100,
      statusTimeoutMs: 8_000,
    });

    try {
      await printTask.printInit();
      await printTask.printPage(encoded, quantity);
      await printTask.waitForPageFinished();
      await printTask.waitForFinished();
    } catch (error: unknown) {
      this.logger(error);
      throw this.toError(error, 'Failed while printing label');
    } finally {
      try {
        await printTask.printEnd();
      } catch (error: unknown) {
        this.logger(error);
      }
    }
  }
}
