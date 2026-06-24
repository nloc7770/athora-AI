import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AxiosError } from 'axios';

interface AiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

@Catch()
export class AiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const result = this.resolveError(exception);

    response.status(result.statusCode).json(result);
  }

  private resolveError(exception: unknown): AiErrorResponse {
    if (this.isAxiosError(exception)) {
      return this.handleAxiosError(exception);
    }

    if (exception instanceof Error) {
      return this.handleGenericError(exception);
    }

    this.logger.error('Unknown AI pipeline error', exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during AI processing.',
      error: 'InternalError',
    };
  }

  private handleAxiosError(error: AxiosError): AiErrorResponse {
    const status = error.response?.status;
    const data = error.response?.data;

    this.logger.error(
      `AI/RAGFlow request failed [${status}]: ${error.message}`,
      { url: error.config?.url, data },
    );

    if (status === 401 || status === 403) {
      return {
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'AI service authentication failed. Please contact support.',
        error: 'AiAuthError',
      };
    }

    if (status === 429) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'AI service rate limit reached. Please try again shortly.',
        error: 'AiRateLimitError',
      };
    }

    if (status && status >= 500) {
      return {
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'AI service is temporarily unavailable. Please try again later.',
        error: 'AiServiceUnavailable',
      };
    }

    return {
      statusCode: HttpStatus.BAD_GATEWAY,
      message: 'Failed to communicate with AI service.',
      error: 'AiConnectionError',
    };
  }

  private handleGenericError(error: Error): AiErrorResponse {
    this.logger.error(`AI pipeline error: ${error.message}`, error.stack);

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return {
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: 'AI request timed out. Try a smaller input or retry.',
        error: 'AiTimeoutError',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An error occurred during AI processing.',
      error: 'AiProcessingError',
    };
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as AxiosError).isAxiosError === true
    );
  }
}
