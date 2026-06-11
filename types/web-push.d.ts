declare module "web-push" {
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void;
  export function sendNotification(
    pushSubscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    payload?: string,
    options?: Record<string, unknown>,
  ): Promise<{ statusCode: number; body: string }>;
}
