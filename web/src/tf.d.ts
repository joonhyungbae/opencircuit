declare module "/vendor/transformers.min.js" {
  export const env: {
    allowLocalModels: boolean;
    allowRemoteModels?: boolean;
    useBrowserCache: boolean;
  };
  export const RawImage: {
    fromBlob: (blob: Blob) => Promise<unknown>;
    read: (input: unknown) => Promise<unknown>;
  };
  export function pipeline(
    task: string,
    model: string,
    opts?: object,
  ): Promise<unknown>;
}

declare module "@tf" {
  export const env: {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
  };
  export function pipeline(
    task: string,
    model: string,
    opts?: object,
  ): Promise<(img: string, opts?: object) => Promise<unknown>>;
}
