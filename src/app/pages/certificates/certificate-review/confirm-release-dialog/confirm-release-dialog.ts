import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';

export interface ConfirmReleaseDialogData {
  total: number;
}

@Component({
  selector: 'app-confirm-release-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, A11yModule],
  templateUrl: './confirm-release-dialog.html',
  styleUrl: './confirm-release-dialog.scss',
})
export class ConfirmReleaseDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmReleaseDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmReleaseDialogData,
  ) {}

  public cancel(): void {
    this.dialogRef.close(false);
  }

  public confirm(): void {
    this.dialogRef.close(true);
  }
}
