import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>('RESEND_API_KEY');

    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = this.normalizeFromEmail(
      this.configService.get<string>(
        'RESEND_FROM_EMAIL',
        'Tareitas <onboarding@resend.dev>',
      ) ?? 'Tareitas <onboarding@resend.dev>',
    );
  }

  private normalizeFromEmail(value: string): string {
    const trimmed = value.trim();

    if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(trimmed)) {
      return trimmed;
    }

    if (
      /^.+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/.test(trimmed)
    ) {
      return trimmed;
    }

    this.logger.error(
      `Invalid RESEND_FROM_EMAIL "${trimmed}". Use noreply@yourdomain.com or Name <noreply@yourdomain.com>`,
    );

    return trimmed;
  }

  async sendPasswordResetCode(
    email: string,
    code: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logDevFallback(email, code, 'RESEND_API_KEY not set');
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Your Tareitas PIN reset code',
      text: `Your PIN reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this email.`,
    });

    if (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${error.message}`,
      );

      if (this.isResendTestDomain()) {
        this.logger.warn(
          'Resend test domain (resend.dev) can only send to your Resend account email. Verify a domain at resend.com and set RESEND_FROM_EMAIL to send to any recipient.',
        );
      }

      this.logDevFallback(email, code, error.message);
    }
  }

  private isResendTestDomain(): boolean {
    return this.fromEmail.includes('@resend.dev');
  }

  private logDevFallback(
    email: string,
    code: string,
    reason: string,
  ): void {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return;
    }

    this.logger.warn(
      `Password reset code for ${email}: ${code} (${reason})`,
    );
  }
}
