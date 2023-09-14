export default abstract class InfrastructureService {
  protected responseHandler = <T extends (...args: never[]) => ReturnType<T>>(fn: T) => (
    ...args: Parameters<T>
  ): ReturnType<T> => {
    return Promise.resolve(fn(...args)).catch((err) => {
      return Promise.reject(this.handleError(err));
    }) as ReturnType<T>;
  };

  protected abstract handleError(error: Error): Error;
}
