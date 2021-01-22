import crypto from 'crypto'
import { dbConnection } from '../persistence/db-connection'
import { SaltRepository } from '../persistence/Salt'
import { promisify } from 'util'

const scrypt = promisify<
  crypto.BinaryLike,
  crypto.BinaryLike,
  number,
  crypto.ScryptOptions,
  Buffer
>(crypto.scrypt)

const COST = 2 ** 13
const HEX_STR_LEN = 64
const SHA_ROUNDS = 5

export const hash = async (
  ...inputs: (string | string[])[]
): Promise<string[]> => {
  await dbConnection

  const { salt } = await SaltRepository.findOne()

  const keys = (
    await scrypt(
      inputs[0].toString(),
      salt,
      (HEX_STR_LEN / 2) * inputs.length,
      {
        cost: COST,
      }
    )
  )
    .toString('hex')
    .match(new RegExp(`.{${HEX_STR_LEN}}`, 'g'))

  for (let i = 1; i < keys.length; i++)
    for (let r = 0; r < SHA_ROUNDS; r++)
      keys[i] = crypto
        .createHash('sha256')
        .update(salt + keys[i] + inputs[i])
        .digest('hex')

  return keys.map((key) => Buffer.from(key, 'hex').toString('base64'))
}
