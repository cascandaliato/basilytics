import mongoose, { Document, Model, Schema } from 'mongoose'

type VisitsCount = { views: number; uniques: number }

// export interface IDailyStatistics {
//   siteId: string
//   date: Date
//   site: VisitsCount
//   bounces?: number
//   duration?: { totalSec: number; sessions: number }
//   hours: Map<string, VisitsCount>
//   hostnames?: Map<string, VisitsCount>
//   pages?: Map<string, VisitsCount>
//   referrers?: Map<string, VisitsCount>
//   browser?: Map<string, number>
//   country?: Map<string, number>
//   deviceType?: Map<string, number>
// }

// type IDailyStatisticsDocument = IDailyStatistics & Document

interface IDailyStatisticsDocument extends Document<string> {
  siteId: string
  date: Date
  site: VisitsCount
  bounces?: number
  duration?: { totalSec: number; sessions: number }
  hours: Map<string, VisitsCount>
  hostnames?: Map<string, VisitsCount>
  pages?: Map<string, VisitsCount>
  referrers?: Map<string, VisitsCount>
  browser?: Map<string, number>
  country?: Map<string, number>
  deviceType?: Map<string, number>
}

const DailyStatisticsSchema = new Schema<IDailyStatisticsDocument>(
  {
    siteId: { type: String, required: true },
    date: { type: Date, required: true },
    site: {
      type: { views: Number, uniques: Number },
      required: true,
    },
    bounces: Number,
    duration: { totalSec: Number, sessions: Number },
    hours: {
      type: Map,
      of: { views: Number, uniques: Number, _id: false },
      required: true,
      _id: false,
    },
    hostnames: {
      type: Map,
      of: { views: Number, uniques: Number, _id: false },
      required: true,
    },
    pages: {
      type: Map,
      of: { views: Number, uniques: Number, _id: false },
      required: true,
    },
    referrers: {
      type: Map,
      of: { views: Number, uniques: Number, _id: false },
    },
    browsers: { type: Map, of: Number },
    countries: { type: Map, of: Number },
    deviceTypes: { type: Map, of: Number },
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: true,
    },
    versionKey: false,
  }
)

DailyStatisticsSchema.index({ siteId: 1, date: 1 }, { unique: true })

export const DailyStatistics: Model<IDailyStatisticsDocument> =
  mongoose.models.DailyStatistics ||
  mongoose.model('DailyStatistics', DailyStatisticsSchema, 'daily_statistics')
