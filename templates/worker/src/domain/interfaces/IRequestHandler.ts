export interface IRequestHandler {
  handle(request: Request): Promise<Response>;
  canHandle(request: Request): boolean;
}

export interface IRequestContext {
  readonly request: Request;
  readonly url: URL;
  readonly method: string;
  readonly headers: Headers;
}