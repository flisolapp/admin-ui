import { Component, Inject, inject, OnInit } from '@angular/core';
import { PeopleRecord } from '../../../services/attendance/attendance-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { formatCpf, formatPhone } from '../../../forms/form-field/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface PersonalDataConfirmationDialogData {
  mode: 'edit';
  person?: PeopleRecord;
}

@Component({
  selector: 'app-personal-data-confirmation-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatSnackBarModule,
  ],
  templateUrl: './personal-data-confirmation-dialog.html',
  styleUrl: './personal-data-confirmation-dialog.scss',
})
export class PersonalDataConfirmationDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PersonalDataConfirmationDialog>);
  private readonly snackBar = inject(MatSnackBar);

  public readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: PersonalDataConfirmationDialogData) {
    this.form = this.fb.nonNullable.group({
      name: [data.person?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      federalCode: [
        data.person?.federalCode ?? '',
        [Validators.required, Validators.maxLength(14)],
      ],
      email: [
        data.person?.email ?? '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      phone: [data.person?.phone ?? '', [Validators.required, Validators.maxLength(255)]],
      acceptTerms: ['', Validators.required],
    });
  }

  public ngOnInit(): void {
    this.dialogRef.beforeClosed().subscribe(() => {
      this.form.get('acceptTerms')?.setValue('');
    });
  }

  // ── Input masks ────────────────────────────────────────────────────────────

  public onFederalCodeInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.form.get('federalCode')!.setValue(formatCpf(raw), { emitEvent: false });
  }

  public onPhoneInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.form.get('phone')!.setValue(formatPhone(raw), { emitEvent: false });
  }

  // ── Close / Submit ──────────────────────────────────────────────────────────

  public close(): void {
    this.form.get('acceptTerms')?.setValue('');

    this.snackBar.open('Confirmação cancelada. Os dados não foram enviados.', 'Fechar', {
      duration: 4000,
    });

    this.dialogRef.close();
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    if (this.data.mode === 'edit') {
      const data: PeopleRecord = {
        ...this.data.person,
        name: raw.name,
        federalCode: raw.federalCode,
        email: raw.email,
        phone: raw.phone,
      } as PeopleRecord;

      this.dialogRef.close(data);
      return;
    }

    this.dialogRef.close(raw);
  }
}
