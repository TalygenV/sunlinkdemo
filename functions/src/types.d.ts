declare module 'firebase-functions' {
  namespace https {
    interface CallableContext {
      auth?: {
        uid: string;
        token: any;
      };
      rawRequest: any;
    }

    class HttpsError extends Error {
      constructor(code: string, message: string, details?: any);
    }

    function onCall(handler: (data: any, context: CallableContext) => Promise<any>): any;

    export function onRequest(arg0: (req: any, res: any) => Promise<void>) {
      throw new Error("Function not implemented.");
    }
  }

  namespace logger {
    function info(message: string, data?: any): void;
    function error(message: string, data?: any): void;
  }
}

declare module 'firebase-admin' {
  function initializeApp(): void;
} 