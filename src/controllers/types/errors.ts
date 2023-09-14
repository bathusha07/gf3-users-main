export interface ClientError extends Error {
  statusCode: number;
}
