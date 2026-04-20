import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { UserRecord } from '../../../../services/users/users-service';

@Component({
  selector: 'app-user-delete-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './user-delete-dialog.html',
  styleUrl: './user-delete-dialog.scss',
})
export class UserDeleteDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: UserRecord,
    private readonly dialogRef: MatDialogRef<UserDeleteDialog>,
  ) {}

  public close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
