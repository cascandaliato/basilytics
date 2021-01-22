import type { NextApiRequest, NextApiResponse } from 'next'
import * as uuid from 'uuid'
import { dbConnection } from '../../persistence/db-connection'
import { SaltRepository } from '../../persistence/Salt'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { token } = req.body
    if (
      token !== process.env.REFRESH_SALT_TOKEN ||
      !process.env.REFRESH_SALT_TOKEN
    )
      return res.status(401).send('Unauthorized')

    await dbConnection

    await SaltRepository.upsert({}, { $set: { salt: uuid.v4() } })

    res.status(204).send(null)
  } catch (err) {
    res.status(500).json({
      error: `Internal server error: ${err.message}.`,
    })
  }
}
