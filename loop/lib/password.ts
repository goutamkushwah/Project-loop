import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";

const HASH_ALGORITHM = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("Passwords must contain at least 12 characters.");
  }

  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = await deriveKey(password, salt);

  return [
    HASH_ALGORITHM,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelization, salt, keyHex, ...unexpectedParts] =
    storedHash.split("$");

  if (
    algorithm !== HASH_ALGORITHM ||
    unexpectedParts.length > 0 ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !keyHex
  ) {
    return false;
  }

  const parsedCost = Number(cost);
  const parsedBlockSize = Number(blockSize);
  const parsedParallelization = Number(parallelization);

  if (
    parsedCost !== COST ||
    parsedBlockSize !== BLOCK_SIZE ||
    parsedParallelization !== PARALLELIZATION
  ) {
    return false;
  }

  const expectedKey = Buffer.from(keyHex, "hex");

  if (expectedKey.length !== KEY_LENGTH) {
    return false;
  }

  const actualKey = await deriveKey(password, salt);

  return timingSafeEqual(expectedKey, actualKey);
}