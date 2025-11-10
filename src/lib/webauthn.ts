import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

// Validate required environment variables
const rpName = "Odonnell Christmas List";
const rpID = process.env.NEXT_PUBLIC_RP_ID;
const origin = process.env.NEXT_PUBLIC_ORIGIN;

if (!rpID || !origin) {
  throw new Error(
    "Missing required environment variables: NEXT_PUBLIC_RP_ID and NEXT_PUBLIC_ORIGIN must be set"
  );
}

// Validate rpID format (should be domain only, no protocol/path)
if (rpID.includes("://") || rpID.includes("/")) {
  throw new Error(
    "NEXT_PUBLIC_RP_ID should be a domain name only (e.g., 'localhost' or 'example.com')"
  );
}

// Validate origin format (should be full URL)
try {
  new URL(origin);
} catch {
  throw new Error(
    "NEXT_PUBLIC_ORIGIN should be a full URL (e.g., 'http://localhost:3000')"
  );
}

async function storeChallenge(userId: string, challenge: string) {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS _Challenge (
      user_id TEXT NOT NULL,
      challenge TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, challenge)
    )
  `;

  // Create index for cleanup if it doesn't exist
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_challenge_expires_at ON _Challenge(expires_at)
  `;

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Insert new challenge
  await prisma.$executeRaw`
    INSERT INTO _Challenge (user_id, challenge, expires_at)
    VALUES (${userId}, ${challenge}, ${expiresAt})
  `;

  // Cleanup expired challenges
  await prisma.$executeRaw`
    DELETE FROM _Challenge WHERE expires_at < CURRENT_TIMESTAMP
  `;
}

async function verifyChallenge(userId: string): Promise<string | null> {
  const result = await prisma.$queryRaw<{ challenge: string }[]>`
    SELECT challenge 
    FROM _Challenge 
    WHERE user_id = ${userId}
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!result?.[0]) return null;

  // Delete the used challenge
  await prisma.$executeRaw`
    DELETE FROM _Challenge 
    WHERE user_id = ${userId}
      AND challenge = ${result[0].challenge}
  `;

  return result[0].challenge;
}

export async function getRegOptions(userId: string, userName: string) {
  // Ensure we have valid environment variables at runtime
  if (!rpID || !origin) {
    throw new Error("WebAuthn environment not properly configured");
  }

  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { credentials: true }
  });

  // Get existing credentials to exclude them
  const excludeCredentials = user?.credentials.map(cred => ({
    id: cred.credentialId,
    transports: cred.transports ? JSON.parse(cred.transports) as AuthenticatorTransportFuture[] : undefined,
  })) || [];

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpID as string,
    userID: Buffer.from(userId),
    userName,
    userDisplayName: userName,
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await storeChallenge(userId, options.challenge);
  return options;
}

export async function verifyReg(userId: string, userName: string, response: RegistrationResponseJSON, deviceName?: string) {
  if (!rpID || !origin) {
    throw new Error("WebAuthn environment not properly configured");
  }

  const expectedChallenge = await verifyChallenge(userId);
  if (!expectedChallenge) throw new Error("Challenge missing or expired");

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin as string,
    expectedRPID: rpID as string,
    requireUserVerification: false,
  });

  if (verification.verified) {
    const { credential } = verification.registrationInfo;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // Create new user with their first credential
      await prisma.user.create({
        data: {
          id: userId,
          name: userName,
          credentials: {
            create: {
              credentialId: credential.id,
              publicKey: Buffer.from(credential.publicKey),
              transports: response.response.transports ? JSON.stringify(response.response.transports) : null,
              counter: BigInt(0),
              deviceName,
            },
          },
        },
      });
    } else {
      // Add new credential to existing user
      await prisma.credential.create({
        data: {
          userId,
          credentialId: credential.id,
          publicKey: Buffer.from(credential.publicKey),
          transports: response.response.transports ? JSON.stringify(response.response.transports) : null,
          counter: BigInt(0),
          deviceName,
        },
      });
    }
  }

  return verification;
}

export async function getAuthOptions(userId?: string) {
  if (!rpID || !origin) {
    throw new Error("WebAuthn environment not properly configured");
  }

  const allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];

  if (userId) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { credentials: true }
    });
    
    if (user?.credentials) {
      user.credentials.forEach(cred => {
        allowCredentials.push({
          id: cred.credentialId,
          transports: cred.transports ? 
            JSON.parse(cred.transports) as AuthenticatorTransportFuture[] : 
            undefined,
        });
      });
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: rpID as string,
    allowCredentials,
    userVerification: "preferred",
  });

  if (userId) {
    await storeChallenge(userId, options.challenge);
  }

  return options;
}

export async function verifyAuth(response: AuthenticationResponseJSON, expectedChallenge: string) {
  if (!rpID || !origin) {
    throw new Error("WebAuthn environment not properly configured");
  }

  // Find the credential by credentialId
  const credential = await prisma.credential.findUnique({
    where: { credentialId: response.id },
    include: { user: true },
  });

  if (!credential) throw new Error("Credential not found");

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin as string,
    expectedRPID: rpID as string,
    requireUserVerification: false,
    credential: {
      id: credential.credentialId,
      publicKey: credential.publicKey,
      counter: Number(credential.counter || 0),
    },
  });

  // If verification succeeds, update the counter and last used time
  if (verification.verified) {
    await prisma.credential.update({
      where: { id: credential.id },
      data: { 
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });
  }

  return { verification, user: credential.user };
}