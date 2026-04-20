import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { Organizer } from '../../../../services/organizers/organizers-service';

@Component({
  selector: 'app-organizer-delete-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './organizer-delete-dialog.html',
  styleUrl: './organizer-delete-dialog.scss',
})
export class OrganizerDeleteDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: Organizer,
    private readonly dialogRef: MatDialogRef<OrganizerDeleteDialog>,
  ) {}

  public close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
