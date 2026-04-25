import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { EditionPlace } from '../../../../services/edition-places/edition-places-service';

@Component({
  selector: 'app-edition-place-delete-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './edition-place-delete-dialog.html',
  styleUrl: './edition-place-delete-dialog.scss',
})
export class EditionPlaceDeleteDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: EditionPlace,
    private readonly dialogRef: MatDialogRef<EditionPlaceDeleteDialog>,
  ) {}

  public close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
