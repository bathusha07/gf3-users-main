import FirebaseServiceImpl from '../../../../src/infrastructure/services/FirebaseServiceImpl';
import FirebaseError from '../../../../src/domain/errors/FirebaseError';

jest.mock('firebase-admin', () => ({
  initializeApp: () => ({
    auth: () => ({
      deleteUser: jest.fn(),
    }),
  }),
  credential: {
    cert: jest.fn(),
  },
}));

const firebase_id = 'test-firebase-id';

describe('FirebaseServiceImpl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize FirebaseAuthService on construction', () => {
    const firebaseService = new FirebaseServiceImpl();
    expect(firebaseService.firebaseAuthService).toBeDefined();
  });

  it('should call FirebaseAuthService.deleteUser', async () => {
    const firebaseService = new FirebaseServiceImpl();
    const deleteUserSpy = jest.spyOn(firebaseService.firebaseAuthService, 'deleteUser');
    await firebaseService.deleteUser(firebase_id);
    expect(deleteUserSpy).toHaveBeenCalledWith(firebase_id);
  });

  it('should throw a BaseDomainError on deleteUser error', async () => {
    const firebaseService = new FirebaseServiceImpl();
    jest.spyOn(firebaseService.firebaseAuthService, 'deleteUser').mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(firebaseService.deleteUser(firebase_id)).rejects.toThrowError(FirebaseError);
  });
});
