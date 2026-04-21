import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageStructure } from '../../components/page-structure/page-structure';
import {
  ChangePasswordPayload,
  ProfileService,
  ProfileUser,
  UpdateProfilePayload,
} from '../../services/profile/profile-service';
import { AuthService } from '../../services/auth/auth-service';

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value ?? '';
    const passwordConfirmation = control.get('password_confirmation')?.value ?? '';

    if (!password && !passwordConfirmation) {
      return null;
    }

    return password === passwordConfirmation ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageStructure,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal<boolean>(true);
  protected readonly saving = signal<boolean>(false);
  protected readonly changingPassword = signal<boolean>(false);

  protected readonly hideCurrentPassword = signal<boolean>(true);
  protected readonly hidePassword = signal<boolean>(true);
  protected readonly hidePasswordConfirmation = signal<boolean>(true);

  protected readonly user = signal<ProfileUser | null>(null);
  protected readonly passwordEnabled = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(121)]],
    changePassword: [false],
    current_password: [''],
    passwordGroup: this.fb.nonNullable.group(
      {
        password: [''],
        password_confirmation: [''],
      },
      { validators: [passwordMatchValidator()] },
    ),
  });

  public ngOnInit(): void {
    this.loadProfile();

    this.passwordEnabled.set(this.form.controls.changePassword.value);

    this.form.controls.changePassword.valueChanges.subscribe((checked) => {
      this.passwordEnabled.set(checked);
      this.configurePasswordValidators(checked);
    });
  }

  protected loadProfile(): void {
    this.loading.set(true);

    this.profileService
      .me()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.user.set(user);

          this.form.patchValue({
            name: user.name ?? '',
            email: user.email ?? '',
            changePassword: false,
            current_password: '',
            passwordGroup: {
              password: '',
              password_confirmation: '',
            },
          });

          this.passwordEnabled.set(false);
          this.configurePasswordValidators(false);
          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: (error) => {
          this.showError(error, 'Não foi possível carregar o perfil.');
        },
      });
  }

  protected save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.updateProfile();
  }

  private updateProfile(): void {
    const payload: UpdateProfilePayload = {
      name: this.form.controls.name.value.trim(),
      email: this.form.controls.email.value.trim().toLowerCase(),
    };

    this.saving.set(true);

    this.profileService
      .updateProfile(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          this.user.set(user);

          if (this.passwordEnabled()) {
            this.updatePassword();
            return;
          }

          this.snackBar.open('Perfil atualizado com sucesso.', 'Fechar', {
            duration: 3500,
          });

          this.form.markAsPristine();
        },
        error: (error) => {
          this.showError(error, 'Não foi possível atualizar o perfil.');
        },
      });
  }

  private updatePassword(): void {
    const payload: ChangePasswordPayload = {
      current_password: this.form.controls.current_password.value,
      password: this.form.controls.passwordGroup.controls.password.value,
      password_confirmation: this.form.controls.passwordGroup.controls.password_confirmation.value,
    };

    this.changingPassword.set(true);

    this.profileService
      .changePassword(payload)
      .pipe(finalize(() => this.changingPassword.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Perfil e senha atualizados com sucesso.', 'Fechar', {
            duration: 4000,
          });

          this.form.patchValue({
            changePassword: false,
            current_password: '',
            passwordGroup: {
              password: '',
              password_confirmation: '',
            },
          });

          this.passwordEnabled.set(false);
          this.configurePasswordValidators(false);
          this.form.markAsPristine();
          this.form.markAsUntouched();

          this.authService.logout();
        },
        error: (error) => {
          this.showError(error, 'Perfil atualizado, mas não foi possível alterar a senha.');
        },
      });
  }

  private configurePasswordValidators(enabled: boolean): void {
    const currentPasswordControl = this.form.controls.current_password;
    const passwordControl = this.form.controls.passwordGroup.controls.password;
    const passwordConfirmationControl =
      this.form.controls.passwordGroup.controls.password_confirmation;

    if (enabled) {
      currentPasswordControl.setValidators([Validators.required]);

      passwordControl.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/),
      ]);

      passwordConfirmationControl.setValidators([Validators.required]);
    } else {
      currentPasswordControl.clearValidators();
      passwordControl.clearValidators();
      passwordConfirmationControl.clearValidators();

      currentPasswordControl.setValue('', { emitEvent: false });
      passwordControl.setValue('', { emitEvent: false });
      passwordConfirmationControl.setValue('', { emitEvent: false });
    }

    currentPasswordControl.updateValueAndValidity({ emitEvent: false });
    passwordControl.updateValueAndValidity({ emitEvent: false });
    passwordConfirmationControl.updateValueAndValidity({ emitEvent: false });
    this.form.controls.passwordGroup.updateValueAndValidity({ emitEvent: false });
  }

  protected controlHasError(
    path: 'name' | 'email' | 'current_password',
    errorCode?: string,
  ): boolean {
    const control = this.form.controls[path];

    if (!(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  protected passwordControlHasError(
    path: 'password' | 'password_confirmation',
    errorCode?: string,
  ): boolean {
    const control = this.form.controls.passwordGroup.controls[path];

    if (!(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  protected passwordGroupHasError(errorCode: string): boolean {
    const group = this.form.controls.passwordGroup;
    const confirmation = group.controls.password_confirmation;

    return !!group.hasError(errorCode) && (confirmation.touched || confirmation.dirty);
  }

  private showError(error: unknown, fallbackMessage: string): void {
    const response = error as {
      error?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };

    const firstFieldError = response?.error?.errors
      ? Object.values(response.error.errors)[0]?.[0]
      : null;

    const message = firstFieldError || response?.error?.message || fallbackMessage;

    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
    });
  }
}
