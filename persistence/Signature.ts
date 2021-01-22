import mongoose, { Document, Schema } from 'mongoose'
import { roundToNearestHour } from '../utils/round-to-nearest-hour'
import { MongooseRepository } from './Repository'

type Signature = {
  _id: string
}

const SignatureSchema = new Schema<Signature & Document>(
  { _id: { type: String, required: true } },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
      currentTime: () => roundToNearestHour().getTime(),
    },
    versionKey: false,
  }
)

SignatureSchema.index({ createdAt: 1 }, { expires: '1 day' })

const SignatureModel =
  (process.env.NODE_ENV === 'development' ? mongoose.models.Signature : null) ||
  mongoose.model('Signature', SignatureSchema)

export const SignatureRepository = new MongooseRepository<Signature>(
  SignatureModel
)
