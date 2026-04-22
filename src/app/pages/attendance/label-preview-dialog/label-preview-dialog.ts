import { Component, Inject, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { LabelService } from '../../../services/label/label-service';
import {
  ConnectionType,
  LabelPrinterService,
} from '../../../services/label-printer/label-printer-service';
import { STORAGE_KEYS } from '../../../constants/storage-keys';

@Component({
  selector: 'app-label-preview-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './label-preview-dialog.html',
  styleUrl: './label-preview-dialog.scss',
})
export class LabelPreviewDialog implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly labelService = inject(LabelService);
  private readonly labelPrinterService = inject(LabelPrinterService);
  private readonly snackBar = inject(MatSnackBar);

  public readonly form: FormGroup<{
    connectionType: FormControl<ConnectionType>;
  }> = this.fb.group({
    connectionType: 'serial' as ConnectionType,
  });

  constructor(
    private readonly dialogRef: MatDialogRef<LabelPreviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string },
  ) {}

  public ngOnInit(): void {
    this.restoreConnectionType();
    this.watchConnectionTypeChanges();
  }

  public async print(): Promise<void> {
    let connected = false;

    try {
      const connectionType: ConnectionType = this.form.controls.connectionType.value;

      const response: Response = await fetch(this.data.imageUrl);
      const blob: Blob = await response.blob();

      const printableBlob: Blob = await this.labelService.prepareForPrint(blob);

      await this.labelPrinterService.connect(connectionType);
      connected = true;

      await this.labelPrinterService.printBlob(printableBlob);

      this.snackBar.open('Etiqueta enviada para impressão.', 'Fechar', {
        duration: 3000,
      });
    } catch (error: unknown) {
      console.error('Error while printing label:', error);

      const message =
        error instanceof Error ? error.message : 'Ocorreu um erro ao imprimir a etiqueta.';

      this.snackBar.open(message, 'Fechar', {
        duration: 4000,
      });
    } finally {
      if (connected) {
        await this.labelPrinterService.disconnect();
      }
    }
  }

  public close(): void {
    this.dialogRef.close();
  }

  private restoreConnectionType(): void {
    const saved = localStorage.getItem(STORAGE_KEYS.LABEL_PRINTER_CONNECTION_TYPE);

    if (this.isConnectionType(saved)) {
      this.form.controls.connectionType.setValue(saved, { emitEvent: false });
    }
  }

  private watchConnectionTypeChanges(): void {
    this.form.controls.connectionType.valueChanges.subscribe((value: ConnectionType) => {
      localStorage.setItem(STORAGE_KEYS.LABEL_PRINTER_CONNECTION_TYPE, value);
    });
  }

  private isConnectionType(value: string | null): value is ConnectionType {
    return value === 'serial' || value === 'bluetooth';
  }
}
