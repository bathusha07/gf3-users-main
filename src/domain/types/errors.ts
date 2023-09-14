export interface DomainError {
  name: string;
  message: string;
  statusCode: number;
}

export interface NotFoundError extends DomainError {
  resourceName: string;
  resourceId: string | number;
}
