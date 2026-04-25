import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  CreateEditionPlacePayload,
  EditionPlace,
  EditionPlaceKind,
  UpdateEditionPlacePayload,
} from '../../../../services/edition-places/edition-places-service';

export interface EditionPlaceFormDialogData {
  mode: 'create' | 'edit';
  editionId: number;
  editionPlace?: EditionPlace;
}

interface EditionPlaceKindOption {
  value: EditionPlaceKind;
  label: string;
}

@Component({
  selector: 'app-edition-place-form-dialog',
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
  templateUrl: './edition-place-form-dialog.html',
  styleUrl: './edition-place-form-dialog.scss',
})
export class EditionPlaceFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditionPlaceFormDialog>);

  public readonly isEditMode: boolean;

  public readonly kindOptions: EditionPlaceKindOption[] = [
    { value: 'room', label: 'Sala' },
    { value: 'lab', label: 'Laboratório' },
    { value: 'main_space', label: 'Espaço principal' },
    { value: 'talk_room', label: 'Sala de palestra' },
    { value: 'food_area', label: 'Área de alimentação' },
    { value: 'support', label: 'Apoio' },
    { value: 'closing', label: 'Encerramento' },
  ];

  public readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: EditionPlaceFormDialogData) {
    this.isEditMode = this.data.mode === 'edit';

    this.form = this.fb.nonNullable.group({
      kind: [this.data.editionPlace?.kind ?? ('room' as EditionPlaceKind), [Validators.required]],
      name: [this.data.editionPlace?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      description: [this.data.editionPlace?.description ?? '', [Validators.maxLength(255)]],
      floor: [this.data.editionPlace?.floor ?? '', [Validators.maxLength(50)]],
      capacity: [this.data.editionPlace?.capacity ?? (null as number | null), [Validators.min(0)]],
      active: [this.data.editionPlace?.active ?? true],
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

    const payload = {
      kind: raw.kind,
      name: raw.name,
      description: raw.description || null,
      floor: raw.floor || null,
      capacity: raw.capacity ?? null,
      active: raw.active,
    };

    if (this.data.mode === 'create') {
      const createPayload: CreateEditionPlacePayload = {
        edition_id: this.data.editionId,
        ...payload,
      };

      this.dialogRef.close(createPayload);
      return;
    }

    const updatePayload: UpdateEditionPlacePayload = payload;

    this.dialogRef.close(updatePayload);
  }
}
