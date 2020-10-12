import { auth } from 'firebase-admin';

import { admin } from './firebase';

const getUserRecord = (uid: string): Promise<auth.UserRecord> => admin.auth().getUser(uid);

const verifyIdToken = (idToken: string): Promise<auth.DecodedIdToken> => admin.auth().verifyIdToken(idToken);

const createSessionToken = async (idToken: string): Promise<string> => {
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const token = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn })
        .catch((error) => {
            console.log(error);
            throw new Error('error creating user session token');
        });

    if (token) return token;

    throw new Error('error creating user session token');
};

const verifySessionToken = async (sessionToken: string): Promise<{ id: string }> => {
    const user = await admin
        .auth()
        .verifySessionCookie(sessionToken, true)
        .catch((error) => {
            console.log(error);
            throw new Error('error verifying session token');
        });

    if (user.uid) {
        return { id: user.uid };
    } else {
        throw new Error('error matching session token to user');
    }
};

export { createSessionToken, verifyIdToken, getUserRecord, verifySessionToken };
