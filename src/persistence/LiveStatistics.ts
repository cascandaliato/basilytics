import mongoose, { Document, Model, Schema } from 'mongoose'

// export interface ILiveStatistics {
//   page: string
//   presenceSignature: string
//   referrer?: string
//   siteId: string
// }

// type ILiveStatisticsDocument = ILiveStatistics & Document

interface ILiveStatisticsDocument extends Document<string> {
  page: string
  presenceSignature: string
  referrer?: string
  siteId: string
}

const LiveStatisticsSchema = new Schema<ILiveStatisticsDocument>(
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

export const LiveStatistics: Model<ILiveStatisticsDocument> =
  mongoose.models.LiveStatistics ||
  mongoose.model('LiveStatistics', LiveStatisticsSchema, 'live_statistics')
