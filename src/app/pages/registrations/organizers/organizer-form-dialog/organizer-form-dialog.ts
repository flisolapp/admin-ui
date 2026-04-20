import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Organizer } from '../../../../services/organizers/organizers-service';

export interface OrganizerFormDialogData {
  mode: 'create' | 'edit';
  organizer?: Organizer;
}

@Component({
  selector: 'app-organizer-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './organizer-form-dialog.html',
  styleUrl: './organizer-form-dialog.scss',
})
export class OrganizerFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OrganizerFormDialog>);

  public readonly isEditMode;

  public readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: OrganizerFormDialogData) {
    this.isEditMode = this.data.mode === 'edit';

    this.form = this.fb.nonNullable.group({
      name: [this.data.organizer?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      email: [
        this.data.organizer?.email ?? '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      phone: [this.data.organizer?.phone ?? '', [Validators.required, Validators.maxLength(255)]],
      federal_code: [this.data.organizer?.federalCode ?? '', [Validators.maxLength(255)]],
      // edition_id: [null as number | null, this.data.mode === 'create' ? [Validators.required] : []],
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

    if (this.data.mode === 'edit') {
      this.dialogRef.close({
        name: raw.name ?? undefined,
        email: raw.email ?? undefined,
        phone: raw.phone ?? undefined,
        federal_code: raw.federal_code || null,
      });
      return;
    }

    this.dialogRef.close({
      name: raw.name ?? '',
      email: raw.email ?? '',
      phone: raw.phone ?? '',
      federal_code: raw.federal_code || null,
      // edition_id: raw.edition_id,
    });
  }
}
