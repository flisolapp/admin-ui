import { Component, inject, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { LabelService } from '../../../services/label/label-service';
import { LabelPrinterService } from '../../../services/label-printer/label-printer-service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-label-preview-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatSnackBarModule,
  ],
  templateUrl: './label-preview-dialog.html',
  styleUrl: './label-preview-dialog.scss',
})
export class LabelPreviewDialog {
  private readonly labelService = inject(LabelService);
  private readonly labelPrinterService = inject(LabelPrinterService);
  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private dialogRef: MatDialogRef<LabelPreviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string },
  ) {}

  public async print(): Promise<void> {
    let connected = false;

    try {
      const response: Response = await fetch(this.data.imageUrl);
      const blob: Blob = await response.blob();

      const rotatedBlob: Blob = await this.labelService.rotateClockwise(blob);

      await this.labelPrinterService.connect();
      connected = true;

      await this.labelPrinterService.printBlob(rotatedBlob);
    } catch (error: unknown) {
      console.error('Error while printing label:', error);

      const message =
        error instanceof Error ? error.message : 'Ocorreu um erro ao imprimir a etiqueta';

      this.snackBar.open(message, 'Fechar', {
        duration: 3000,
      });
    } finally {
      if (connected) {
        this.labelPrinterService.disconnect();
      }
    }
  }

  public close(): void {
    this.dialogRef.close();
  }
}
