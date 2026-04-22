import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { LabelRecord } from '../../../services/label/label-service';

export interface LabelFormDialogData {
  mode: 'generate';
  label?: LabelRecord;
}

@Component({
  selector: 'app-label-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './label-form-dialog.html',
  styleUrl: './label-form-dialog.scss',
})
export class LabelFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LabelFormDialog>);

  public readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: LabelFormDialogData) {
    this.form = this.fb.nonNullable.group({
      firstName: [data.label?.firstName ?? '', [Validators.required, Validators.maxLength(14)]],
      lastName: [data.label?.lastName ?? '', [Validators.required, Validators.maxLength(14)]],
    });
  }

  public close(): void {
    this.dialogRef.close();
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    if (this.data.mode === 'generate') {
      const data: any = JSON.parse(JSON.stringify(this.data.label));
      data.firstName = raw.firstName;
      data.lastName = raw.lastName;

      this.dialogRef.close(data);
      return;
    }

    this.dialogRef.close(raw);
  }
}
