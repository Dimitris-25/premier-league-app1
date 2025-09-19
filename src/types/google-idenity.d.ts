export {};

declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google {
    namespace accounts.id {
      interface CredentialResponse {
        credential: string;         // JWT ID token
        clientId?: string;
        select_by?: string;
      }
      interface InitializeOptions {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        context?: "signin" | "signup" | "use";
      }
      interface ButtonConfiguration {
        type?: "standard" | "icon";
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "small" | "medium" | "large";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        shape?: "rectangular" | "pill" | "circle" | "square";
        logo_alignment?: "left" | "center";
        width?: number | string;
        locale?: string;
      }

      function initialize(options: InitializeOptions): void;
      function renderButton(parent: HTMLElement, options: ButtonConfiguration): void;
      function prompt(cb?: (n: PromptMomentNotification) => void): void;

      interface PromptMomentNotification {
        isDisplayed(): boolean;
        isNotDisplayed(): boolean;
        getNotDisplayedReason(): string;
        isSkippedMoment(): boolean;
        getSkippedReason(): string;
        isDismissedMoment(): boolean;
        getDismissedReason(): string;
        getMomentType(): string;
      }
    }
  }
}
