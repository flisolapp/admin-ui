import { Component, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { PageAuth } from '../../../components/page-auth/page-auth';
import { getControlError } from '../../../forms/form-field/form-field';
import { FormStorageService } from '../../../services/form-storage/form-storage-service';
import { AuthService, LoginPayload } from '../../../services/auth/auth-service';
import { SNACK_DURATION } from '../../../app.config';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageAuth,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  public submittedSig: WritableSignal<boolean> = signal<boolean>(false);
  // public restoredSig: WritableSignal<boolean> = signal(false);
  public showPassword: WritableSignal<boolean> = signal<boolean>(false);
  public loading: WritableSignal<boolean> = signal<boolean>(false);

  public form!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly storage: FormStorageService,
    private readonly translate: TranslateService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  public ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // this.restoredSig.set(true);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Validation helpers ─────────────────────────────────────────────────────

  public getError(controlName: string): string | null {
    return getControlError(this.form.get(controlName), this.submittedSig(), this.translate, {
      cpfInvalid: 'formCollaborator.federalCodeInvalid',
    });
  }

  public hasError(controlName: string): boolean {
    return !!this.getError(controlName);
  }

  // ── Submit / Back ──────────────────────────────────────────────────────────

  public onSubmit(event: Event): void {
    event.preventDefault();
    this.submittedSig.set(true);
    this.form.markAllAsTouched();

    this.loading.set(true);

    // LoginPayload

    const { email, password } = this.form.value;
    const payload: LoginPayload = { email: email!, password: password! };

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/registrations/talks']), // this.router.navigate(['/dashboard']),
      error: () => {
        this.loading.set(false);
        // this.errorMsg.set('E-mail ou senha inválidos. Verifique suas credenciais.');
        this.snackBar.open(
          'E-mail ou senha inválidos. Verifique suas credenciais.',
          this.translate.instant('common.ok'),
          {
            duration: SNACK_DURATION,
          },
        );
      },
    });
  }
}
