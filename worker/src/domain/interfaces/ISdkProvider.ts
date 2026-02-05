export interface ISdkProvider {
  serveSdk(request: Request): Promise<Response>;
  getSdkContent(): Promise<string>;
}

export interface SdkConfig {
  version: string;
  endpoint: string;
  contentType: string;
}