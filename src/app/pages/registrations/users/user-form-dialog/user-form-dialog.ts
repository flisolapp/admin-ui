import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { UserRecord, UserRole } from '../../../../services/users/users-service';

export interface UserFormDialogData {
  mode: 'create' | 'edit';
  user?: UserRecord;
}

@Component({
  selector: 'app-user-form-dialog',
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
  templateUrl: './user-form-dialog.html',
  styleUrl: './user-form-dialog.scss',
})
export class UserFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialog>);

  public readonly roles: UserRole[] = ['super_admin', 'admin', 'organizer', 'credential'];
  public readonly isEditMode;

  public readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: UserFormDialogData) {
    this.isEditMode = this.data.mode === 'edit';

    this.form = this.fb.nonNullable.group({
      name: [data.user?.name ?? '', [Validators.required, Validators.maxLength(200)]],
      email: [
        data.user?.email ?? '',
        [Validators.required, Validators.email, Validators.maxLength(121)],
      ],
      role: [data.user?.role ?? 'organizer', [Validators.required]],
      is_active: [data.user?.isActive ?? true],
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

    if (this.data.mode === 'create') {
      this.dialogRef.close({
        name: raw.name,
        email: raw.email,
        role: raw.role,
      });
      return;
    }

    this.dialogRef.close(raw);
  }
}
