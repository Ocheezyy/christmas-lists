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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) throw new Error("User already registered");

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpID as string,
    userID: Buffer.from(userId),
    userName,
    userDisplayName: userName,
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await storeChallenge(userId, options.challenge);
  return options;
}

export async function verifyReg(userId: string, userName: string, response: RegistrationResponseJSON) {
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
    requireUserVerification: true,
  });

  if (verification.verified) {
    const { credential } = verification.registrationInfo;

    await prisma.user.create({
      data: {
        id: userId,
        name: userName,
        credentialId: credential.id, // Already in base64url format
        publicKey: Buffer.from(credential.publicKey),
        transports: null, // Leave transports null initially
        counter: BigInt(0),
      },
    });
  }

  return verification;
}

export async function getAuthOptions(userId?: string) {
  if (!rpID || !origin) {
    throw new Error("WebAuthn environment not properly configured");
  }

  const credentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.credentialId) {
      credentials.push({
        id: user.credentialId,
        transports: user.transports ? 
          JSON.parse(user.transports) as AuthenticatorTransportFuture[] : 
          undefined,
      });
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: rpID as string,
    allowCredentials: credentials,
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

  // response.id is in base64url format, same as what we stored
  const user = await prisma.user.findUnique({
    where: { credentialId: response.id },
  });

  if (!user) throw new Error("User not found");

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin as string,
    expectedRPID: rpID as string,
    requireUserVerification: true,
    credential: {
      id: user.credentialId,
      publicKey: user.publicKey,
      counter: Number(user.counter || 0),
    },
  });

  // If verification succeeds, update the counter
  if (verification.verified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });
  }

  return { verification, user };
}