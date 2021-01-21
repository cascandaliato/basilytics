import mongoose, { Document, Model, Schema } from 'mongoose'
import { roundToNearestHour } from '../utils/round-to-nearest-hour'

// export interface ISignature {
//   _id: string
// }

// type ISignatureDocument = ISignature & Document<string>

interface ISignatureDocument extends Document<string> {
  _id: string
}

const SignatureSchema = new Schema<ISignatureDocument>(
  {
    _id: { type: String, required: true },
  },
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

export const Signature: Model<ISignatureDocument> =
  mongoose.models.Signature || mongoose.model('Signature', SignatureSchema)
