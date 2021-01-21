import mongoose, { Document, Model, Schema } from 'mongoose'

// export interface ISalt {
//   salt: string
//   updatedAt: Date
// }

// type ISaltDocument = ISalt & Document<string>

interface ISaltDocument extends Document<string> {
  salt: string
  updatedAt: Date
}

const SaltSchema = new Schema<ISaltDocument>(
  {
    salt: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true }, versionKey: false }
)

export const Salt: Model<ISaltDocument> =
  mongoose.models.Salt || mongoose.model('Salt', SaltSchema, 'salt')
