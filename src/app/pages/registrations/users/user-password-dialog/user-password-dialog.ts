import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UserPasswordResponse } from '../../../../services/users/users-service';

@Component({
  selector: 'app-user-password-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './user-password-dialog.html',
  styleUrl: './user-password-dialog.scss',
})
export class UserPasswordDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: UserPasswordResponse,
    private readonly dialogRef: MatDialogRef<UserPasswordDialog>,
  ) {}

  public async copyPassword(): Promise<void> {
    await navigator.clipboard.writeText(this.data.generated_password);
  }

  public close(): void {
    this.dialogRef.close();
  }
}
