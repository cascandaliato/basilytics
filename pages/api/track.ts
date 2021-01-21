import type { NextApiRequest, NextApiResponse } from 'next'
import UAParser from 'ua-parser-js'
import { DailyStatistics } from '../../src/persistence/DailyStatistics'
import { LiveStatistics } from '../../src/persistence/LiveStatistics'
import { Signature } from '../../src/persistence/Signature'
import { getCountry } from '../../src/utils/get-country'
import { hash } from '../../src/utils/hash'
import { roundToNearestHour } from '../../src/utils/round-to-nearest-hour'

export default async (req: NextApiRequest, res: NextApiResponse) => {
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

  const [userSig, pageSig, timerSig, presenceSig] = await hash(
    [ip, userAgent, today, siteId],
    [hostname, path],
    'timer',
    'presence' // remove today to avoid double counting around midnight
  )

  const isSiteUnique = !(await Signature.findOneAndUpdate(
    {
      _id: userSig,
    },
    { $setOnInsert: { _id: userSig } },
    { upsert: true, projection: { _id: 0, createdAt: 0 } }
  )
    .lean()
    .exec())

  const isPageUnique = !(await Signature.findOneAndUpdate(
    {
      _id: pageSig,
    },
    { $setOnInsert: { _id: pageSig } },
    { upsert: true, projection: { _id: 0, createdAt: 0 } }
  )
    .lean()
    .exec())

  await LiveStatistics.updateOne(
    { presenceSignature: presenceSig },
    {
      $set: {
        siteId,
        presenceSignature: presenceSig,
        page: path,
        referrer,
      },
    },
    { upsert: true }
  ).exec()

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
  console.log({ increments })

  await DailyStatistics.updateOne(
    { siteId, date: today },
    {
      $set: {
        siteId,
        date: today,
      },
      $inc: increments,
    },
    { upsert: true }
  ).exec()

  res.json({
    userSig,
    pageSig,
    timerSig,
    presenceSig,
    ip,
    userAgent,
    country,
    browser,
    deviceType,
    dailyStats: await DailyStatistics.findOne({
      siteId,
      date: today,
    }).exec(),
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
}
