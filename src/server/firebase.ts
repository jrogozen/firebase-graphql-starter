import * as firebaseAdmin from 'firebase-admin';

import serviceAccount from '../../creds/fir-graphql-starter-e1ea3-firebase-adminsdk-hb83u-d75170a8be.json';

const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
        privateKey: serviceAccount.private_key,
        clientEmail: serviceAccount.client_email,
        projectId: serviceAccount.project_id,
    }),
    databaseURL: 'https://fir-graphql-starter-e1ea3.firebaseio.com',
});
const db = admin.firestore();

db.settings({ ignoreUndefinedProperties: true });

export { admin, db };
