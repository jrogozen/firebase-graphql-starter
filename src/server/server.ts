import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import { verifyIdToken, getUserRecord, createSessionToken, verifySessionToken } from './auth';
import { db } from './firebase';

type User = {
    id: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    roles?: string[];
    emailVerified: boolean;
    photoUrl?: string;
    disabled: boolean;
};

const typeDefs = gql`
    type User {
        id: ID!
        email: String
        emailVerified: Boolean
        displayName: String
        photoUrl: String
        disabled: Boolean
        phoneNumber: String
        roles: [String]
        items: [Item]
        token: String
    }

    type Item {
        id: ID!
        name: String
        description: String
        price: String
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        users: [User]
        getUserById(id: String!): User
    }

    type Mutation {
        auth(idToken: String!): AuthPayload
    }
`;

const resolvers = {
    Query: {
        users: async () => {
            const snapshot = await db.collection('users').get();

            if (snapshot.empty) {
                return [];
            }

            const results: User[] = [];

            snapshot.forEach((doc) => {
                const { displayName, email, phoneNumber, emailVerified, photoUrl, disabled } = doc.data();

                const user: User = {
                    id: doc.id,
                    displayName,
                    email,
                    phoneNumber,
                    emailVerified,
                    photoUrl,
                    disabled,
                };

                results.push(user);
            });

            return results;
        },
        getUserById: async (parent, { id }: { id: string }) => {
            const doc = await db.collection('users').doc(id).get();

            if (!doc.exists) {
                return null;
            }

            return {
                ...doc.data(),
                id,
            };
        },
    },
    Mutation: {
        async auth(parent, { idToken }: { idToken: string }) {
            const { uid } = await verifyIdToken(idToken);
            const firebaseUser = await getUserRecord(uid);
            const { displayName, email, emailVerified, phoneNumber, photoURL, disabled } = firebaseUser;

            const user: Partial<User> = {
                displayName,
                email,
                emailVerified,
                phoneNumber,
                photoUrl: photoURL,
                disabled,
            };

            const res = await db.collection('users').doc(uid).set(
                {
                    displayName,
                    email,
                    emailVerified,
                    phoneNumber,
                    photoUrl: photoURL,
                    disabled,
                },
                { merge: true },
            );

            // temp: ensure roles are only returned for individual users
            // they exist in a separate firestore collection so they are not queried on a user call
            const roles = await db.collection('private-data').doc('roles').get();

            if (roles.exists) {
                const userRoles = roles.data()[uid];

                if (userRoles) user.roles = userRoles;
            }

            const token = await createSessionToken(idToken);

            if (res.isEqual) {
                return {
                    token,
                    user: {
                        ...user,
                        id: uid,
                    },
                };
            }

            throw new Error('could not sign in user');
        },
    },
};

function createServer(): express.Application {
    const app = express();
    const apollo = new ApolloServer({
        typeDefs,
        resolvers,
        context: async (ctx) => {
            const authorization = ctx.req.get('Authorization');

            if (authorization) {
                const token = authorization.replace('Bearer ', '');
                return await verifySessionToken(token);
            }

            return null;
        },
        introspection: true,
        playground: true,
    });

    apollo.applyMiddleware({
        app,
        path: '/',
        cors: true,
    });

    return app;
}

export default createServer;
