import mongoose, { Document, Schema } from 'mongoose'
import { MongooseRepository } from './Repository'

type LiveStatistics = {
  page: string
  presenceSignature: string
  referrer?: string
  siteId: string
}

const LiveStatisticsSchema = new Schema<LiveStatistics & Document>(
  {
    page: { type: String, required: true },
    presenceSignature: { type: String, required: true },
    referrer: String,
    siteId: { type: String, required: true },
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: 'lastSeenAt',
    },
    versionKey: false,
  }
)

LiveStatisticsSchema.index({ siteId: 1 })
LiveStatisticsSchema.index({ presenceSignature: 1 }, { unique: true })
LiveStatisticsSchema.index({ lastSeenAt: 1 }, { expires: '10 minutes' })

const LiveStatisticsModel =
  (process.env.NODE_ENV === 'development'
    ? mongoose.models.LiveStatistics
    : null) ||
  mongoose.model('LiveStatistics', LiveStatisticsSchema, 'live_statistics')

export const LiveStatisticsRepository = new MongooseRepository<LiveStatistics>(
  LiveStatisticsModel
)
