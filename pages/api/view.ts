import type { NextApiRequest, NextApiResponse } from 'next'
import { DailyStatistics } from '../../src/persistence/DailyStatistics'
import { dbConnection } from '../../src/persistence/db-connection'
import { LiveStatistics } from '../../src/persistence/LiveStatistics'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await dbConnection

  const { siteId = 'ABCD', from = '2021-01-04', to = '2021-02-17' } = req.body

  const fromDate = new Date(Date.parse(from))
  const toDate = new Date(Date.parse(to))

  // cache results for past dates aggressively
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (toDate < yesterday)
    res.setHeader('Cache-Control', 'max-age=31536000 immutable')

  // type NestedCounter = { [key: string]: number | NestedCounter }
  // const mergeCounters = (
  //   target: NestedCounter,
  //   source: NestedCounter
  // ): void => {
  //   for (const property in source) {
  //     if (!(property in target)) target[property] = source[property]
  //     else if (
  //       typeof source[property] === 'number' &&
  //       typeof target[property] === 'number'
  //     )
  //       // ლ(ಠ益ಠლ)
  //       target[property] =
  //         (target[property] as number) + (source[property] as number)
  //     else if (
  //       typeof source[property] !== 'number' &&
  //       typeof target[property] !== 'number'
  //     )
  //       mergeCounters(
  //         target[property] as NestedCounter,
  //         source[property] as NestedCounter
  //       )
  //   }
  // }

  const mergeCounters = (target: object, source: object): void => {
    for (const property in source) {
      if (!(property in target)) target[property] = source[property]
      else if (
        typeof source[property] === 'number' &&
        typeof target[property] === 'number'
      )
        target[property] += source[property]
      else if (
        typeof source[property] !== 'number' &&
        typeof target[property] !== 'number'
      )
        mergeCounters(target[property], source[property])
    }
  }

  // const historical: NestedCounter = {}
  const historical = {}
  for await (const doc of DailyStatistics.find(
    {
      siteId,
      $and: [{ date: { $gte: fromDate } }, { date: { $lte: toDate } }],
    },
    { _id: 0, siteId: 0, date: 0, updatedAt: 0 }
  )
    .lean()
    .cursor()) {
    // mergeCounters(historical, doc as NestedCounter)
    mergeCounters(historical, doc)
  }

  const live = { count: 0, pages: {}, referrers: {} }
  for await (const { page, referrer } of LiveStatistics.find(
    {
      siteId,
    },
    { _id: 0, page: 1, referrer: 1 }
  )
    .lean()
    .cursor()) {
    live.count++
    live.pages[page] = (live.pages[page] || 0) + 1
    live.referrers[referrer] = (live.referrers[referrer] || 0) + 1
  }

  res.json({ siteId, fromDate, toDate, live, historical })
}
