import * as FirebaseAdmin from 'firebase-admin';

export interface FirebaseService {
  firebaseAuthService: FirebaseAdmin.auth.Auth;
  deleteUser: (firebase_id: string) => Promise<void>;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
}
