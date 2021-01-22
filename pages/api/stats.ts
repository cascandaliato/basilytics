import type { NextApiRequest, NextApiResponse } from 'next'
import { DailyStatisticsRepository } from '../../persistence/DailyStatistics'
import { dbConnection } from '../../persistence/db-connection'
import { LiveStatisticsRepository } from '../../persistence/LiveStatistics'
import { mergeCounters } from '../../utils/merge-counters'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await dbConnection

    const { siteId, from, to } = req.body
    if (!siteId || !DATE_RE.test(from) || !DATE_RE.test(to))
      return res.status(422).json({
        error:
          'Expecting a valid `siteId` and `from` / `to` dates in `YYYY-MM-DD` format.',
      })

    const fromDate = new Date(Date.parse(from))
    const toDate = new Date(Date.parse(to))

    // cache results for past dates aggressively
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (toDate < yesterday)
      res.setHeader('Cache-Control', 'max-age=31536000 immutable')

    const historical = {}
    for await (const doc of DailyStatisticsRepository.find(
      {
        siteId,
        $and: [{ date: { $gte: fromDate } }, { date: { $lte: toDate } }],
      },
      { _id: 0, siteId: 0, date: 0, updatedAt: 0 }
    )) {
      mergeCounters(historical, doc)
    }

    const live = { count: 0, pages: {}, referrers: {} }
    for await (const { page, referrer } of LiveStatisticsRepository.find(
      { siteId },
      { _id: 0, page: 1, referrer: 1 }
    )) {
      live.count++
      live.pages[page] = (live.pages[page] || 0) + 1
      live.referrers[referrer] = (live.referrers[referrer] || 0) + 1
    }

    res.json({ siteId, fromDate, toDate, live, historical })
  } catch (err) {
    res.status(500).json({
      error: `Internal server error: ${err.message}.`,
    })
  }
}
