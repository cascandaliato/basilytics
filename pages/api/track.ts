import type { NextApiRequest, NextApiResponse } from 'next'
import UAParser from 'ua-parser-js'
import { DailyStatisticsRepository } from '../../persistence/DailyStatistics'
import { LiveStatisticsRepository } from '../../persistence/LiveStatistics'
import { SignatureRepository } from '../../persistence/Signature'
import { getCountry } from '../../utils/get-country'
import { hash } from '../../utils/hash'
import { roundToNearestHour } from '../../utils/round-to-nearest-hour'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const {
      siteId = 'ABCD',
      hostname = 'myHostname',
      path = '/fo2',
      referrer = 'https://www.google.com',
    } = req.body

    const date = roundToNearestHour()
    const hh = date.getHours().toString().padStart(2, '0')
    date.setUTCHours(0, 0, 0, 0)
    const today = date

    const ip = (
      req.headers['x-forwarded-for'] || req.socket.remoteAddress
    ).toString()
    const userAgent = req.headers['user-agent']

    const country = (await getCountry(ip)) || 'Italy'
    const infoFromUA = new UAParser(userAgent)
    const browser = infoFromUA.getBrowser().name
    const deviceType = infoFromUA.getDevice().type || 'Desktop'

    const [userSig, pageSig, presenceSig] = await hash(
      [ip, userAgent, today, siteId],
      [hostname, path],
      'presence' // remove `today` to avoid double counting around midnight
    )

    const isSiteUnique = !(await SignatureRepository.existsOrInsert(
      { _id: userSig },
      { $setOnInsert: { _id: userSig } },
      { _id: 0, createdAt: 0 }
    ))

    const isPageUnique = !(await SignatureRepository.existsOrInsert(
      { _id: pageSig },
      { $setOnInsert: { _id: pageSig } },
      { _id: 0, createdAt: 0 }
    ))

    await LiveStatisticsRepository.upsert(
      { presenceSignature: presenceSig },
      {
        $set: {
          siteId,
          presenceSignature: presenceSig,
          page: path,
          referrer,
        },
      }
    )

    const increments = {
      'site.views': 1,
      [`hours.${hh}.views`]: 1,
      [`hostnames.${hostname}.views`]: 1,
      [`pages.${path}.views`]: 1,
      [`referrers.${referrer}.views`]: +!!referrer,
    }
    if (isSiteUnique) {
      increments['site.uniques'] = 1
      increments[`hours.${hh}.uniques`] = 1
      increments[`hostnames.${hostname}.uniques`] = 1
      increments[`referrers.${referrer}.uniques`] = +!!referrer
      if (browser) increments[`browsers.${browser}`] = 1
      if (country) increments[`countries.${country}`] = 1
      if (deviceType) increments[`deviceTypes.${deviceType}`] = 1
    }
    if (isPageUnique) increments[`pages.${path}.uniques`] = 1

    await DailyStatisticsRepository.upsert(
      { siteId, date: today },
      {
        $set: {
          siteId,
          date: today,
        },
        $inc: increments,
      }
    )

    res.json({
      userSig,
      pageSig,
      presenceSig,
      ip,
      userAgent,
      country,
      browser,
      deviceType,
      dailyStats: await DailyStatisticsRepository.findOne({
        siteId,
        date: today,
      }),
      isSiteUnique,
      isPageUnique,
      today,
      hh,
    })

    // Send tracking pixel

    // const trackingPixel = Buffer.from(
    //   'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    //   'base64'
    // )

    // setHeader/send
    // res.setHeader('Cache-Control', 'no-store, max-age=0')
    // res.setHeader('Content-Type', 'image/gif')
    // res.setHeader('Content-Length', trackingPixel.length)
    // res.status(200).send(trackingPixel)

    // writeHead/end
    // res
    //   .writeHead(200, {
    //     'Cache-Control': 'no-store, max-age=0',
    //     'Content-Type': 'image/gif',
    //     'Content-Length': trackingPixel.length,
    //   })
    //   .end(trackingPixel)
  } catch (err) {
    res.status(500).json({
      error: `Internal server error: ${err.message}.`,
    })
  }
}
