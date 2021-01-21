import type { NextApiRequest, NextApiResponse } from 'next'
import * as uuid from 'uuid'
import { dbConnection } from '../../src/persistence/db-connection'
import { Salt } from '../../src/persistence/Salt'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { token } = req.body
  if (
    token !== process.env.REFRESH_SALT_TOKEN ||
    !process.env.REFRESH_SALT_TOKEN
  )
    return res.status(401).send(null)

  await dbConnection

  await Salt.updateOne(
    {},
    { $set: { salt: uuid.v4() } },
    { upsert: true }
  ).exec()

  res.status(204).send(null)
}
