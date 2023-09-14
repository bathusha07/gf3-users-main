import * as FirebaseAdmin from 'firebase-admin';
import { FirebaseService, FirebaseAuthError } from '../../domain/types/firebase';
import FirebaseError from '../../domain/errors/FirebaseError';

const FIREBASE_SERVICE_NAME = 'Firebase';
const FIREBASE_SETUP_ERROR_MESSAGE = 'Failed to initialize';
const FIREBASE_CONFIG_FILE = 'firebase_config.json';

export default class FirebaseServiceImpl implements FirebaseService {
  private static firebaseAuth: FirebaseAdmin.auth.Auth;
  public get firebaseAuthService(): FirebaseAdmin.auth.Auth {
    return FirebaseServiceImpl.firebaseAuth;
  }

  private initFirebaseAuth = (): FirebaseAdmin.auth.Auth => {
    try {
      return FirebaseAdmin.initializeApp({
        credential: FirebaseAdmin.credential.cert(FIREBASE_CONFIG_FILE),
      }).auth();
    } catch (e) {
      console.log(FIREBASE_SERVICE_NAME, FIREBASE_SETUP_ERROR_MESSAGE);
      return FirebaseAdmin.initializeApp().auth();
    }
  };
  public constructor() {
    if (!FirebaseServiceImpl.firebaseAuth) {
      FirebaseServiceImpl.firebaseAuth = this.initFirebaseAuth();
    }
  }
  public deleteUser = async (firebase_id: string): Promise<void> => {
    try {
      await this.firebaseAuthService.deleteUser(firebase_id);
    } catch (error: unknown) {
      const e = error as FirebaseAuthError;
      throw new FirebaseError(e);
    }
  };
}
