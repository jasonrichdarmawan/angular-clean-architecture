import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IsEmailExistsMock } from '@common/interface-adapters/data-sources/is-email-exists-mock/is-email-exists.mock';
import { IsEmailExistsUseCase } from '@common/application-business-rules/use-cases/is-email-exists/is-email-exists.use-case';
import { ButtonBasicComponent } from '@common/interface-adapters/components/button-basic/button-basic.component';
import { ButtonFlatComponent } from '@common/interface-adapters/components/button-flat/button-flat.component';
import { InputComponent } from '@common/interface-adapters/components/input/input.component';
import { Observable, first, lastValueFrom } from 'rxjs';
import { AccountsLayout } from '../../../interface-adapters/layouts/accounts/accounts.layout';
import { IsFeatureEnabledUseCase } from '@common/application-business-rules/use-cases/is-feature-enabled/is-feature-enabled.use-case';
import { Router, RouterLink } from '@angular/router';
import { ErrorComponent } from '@common/interface-adapters/components/error/error.component';
import { TranslatePipe } from '@common/interface-adapters/pipes/translate/translate.pipe';
import { GetTranslationsUseCase } from '@common/application-business-rules/use-cases/get-translations/get-translations.use-case';
import { HOST_LANGUAGE_TOKEN } from '@common/interface-adapters/tokens/host-language-token/host-language.token';
import { DEFAULT_LANGUAGE_CONSTANT } from '../../../interface-adapters/constants/default_language/language-default.constant';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMAIL_PARAMETER_CONSTANT } from '../challenge/challenge-pwd/constants/email-parameter.constant';
import { IsEmailExistsDataSource } from '@common/application-business-rules/data-sources/is-email-exists/is-email-exists.data-source';

/**
 * @todo translation
 */
@Component({
  selector: 'acc-sign-in-identifier',
  standalone: true,
  imports: [
    AccountsLayout,
    ButtonBasicComponent,
    ButtonFlatComponent,
    ErrorComponent,
    InputComponent,
    RouterLink,
    TranslatePipe,
  ],
  providers: [
    IsEmailExistsUseCase,
    {
      provide: IsEmailExistsDataSource,
      // @todo replace mock
      useClass: IsEmailExistsMock,
    },
  ],
  templateUrl: './sign-in-identifier.page.html',
  styleUrl: './sign-in-identifier.page.scss',
})
export class SignInIdentifierPage implements OnInit, AfterViewInit {
  isChallengePwdEnabled: boolean = false;
  isCreateAccountEnabled: boolean = false;

  email: string = '';
  errorCode: string = '';
  isLoading: boolean = false;

  @ViewChild('inputEmail') inputEmail!: InputComponent;

  translations: Record<string, string> = {};

  constructor(
    @Inject(HOST_LANGUAGE_TOKEN) private hostLanguage$: Observable<string>,
    private getTranslations: GetTranslationsUseCase,
    private isEmailExists: IsEmailExistsUseCase,
    private isFeatureEnabled: IsFeatureEnabledUseCase,
    private router: Router,
  ) {
    this.hostLanguage$.pipe(takeUntilDestroyed()).subscribe((hostLanguage) => {
      this.getTranslations
        .execute(
          () => import(`./sign-in-identifier.${hostLanguage}.json`),
          () =>
            import(`./sign-in-identifier.${DEFAULT_LANGUAGE_CONSTANT}.json`),
        )
        .pipe(first())
        .subscribe({
          next: (translations) => {
            this.translations = translations;
          },
        });
    });
  }

  ngOnInit(): void {
    this.isFeatureEnabled
      .execute('/lifecycle/steps/signup/name')
      .then((response) => {
        if (!response.ok) {
          this.isCreateAccountEnabled = false;
          return;
        }
        this.isCreateAccountEnabled = response.data.isEnabled;
      });
    this.isFeatureEnabled
      .execute('/v3/signin/challenge/pwd')
      .then((response) => {
        if (!response.ok) {
          this.isChallengePwdEnabled = false;
          return;
        }
        this.isChallengePwdEnabled = response.data.isEnabled;
      });
  }

  ngAfterViewInit(): void {
    this.inputEmail.nativeElement.focus();
  }

  async onNext() {
    this.errorCode = '';

    if (!this.email) {
      this.errorCode = 'enter_an_email';
      this.inputEmail.nativeElement.focus();
      return;
    }

    this.isLoading = true;
    const response = await lastValueFrom(
      this.isEmailExists.execute(this.email),
    );
    this.isLoading = false;

    if (!response.ok) {
      switch (response.errorCode) {
        case 'email-not-found':
          this.errorCode = 'email-not-found';
          break;
        default:
          console.warn(
            `${SignInIdentifierPage.name} error code: ${response.errorCode}`,
          );
          this.errorCode = 'unexpected_error';
          break;
      }
      this.inputEmail.nativeElement.focus();
      return;
    }

    this.router.navigate(['/v3/signin/challenge/pwd'], {
      queryParams: { [EMAIL_PARAMETER_CONSTANT]: this.email },
      queryParamsHandling: 'merge',
    });
  }
}
