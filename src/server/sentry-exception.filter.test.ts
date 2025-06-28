import { SentryExceptionFilter } from './sentry-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

describe('SentryExceptionFilter', () => {
  let filter: SentryExceptionFilter;
  let host: any;
  let response: any;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    filter = new SentryExceptionFilter();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    response = {
      status: statusMock,
    };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    };

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Sentry, 'captureException').mockImplementation(() => '');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should capture and log an exception and respond with INTERNAL_SERVER_ERROR for non-HttpException', () => {
    const exception = new Error('Test error');
    filter.catch(exception, host);

    expect(console.log).toHaveBeenCalledWith(exception);
    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Test error',
    });
  });

  it('should use the HttpException status code and message when exception is HttpException', () => {
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    filter.catch(exception, host);

    expect(console.log).toHaveBeenCalledWith(exception);
    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Bad request',
    });
  });

  it('should default to "Internal server error" if exception message is not provided', () => {
    const exception = {};
    filter.catch(exception, host);

    expect(console.log).toHaveBeenCalledWith(exception);
    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
