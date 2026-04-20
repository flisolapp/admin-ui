import { Component } from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-logout-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, A11yModule],
  templateUrl: './confirm-logout-dialog.html',
  styleUrl: './confirm-logout-dialog.scss',
})
export class ConfirmLogoutDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmLogoutDialog>) {}

  public cancel(): void {
    this.dialogRef.close(false);
  }

  public confirm(): void {
    this.dialogRef.close(true);
  }
}
