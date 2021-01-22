import mongoose, { Document, Schema } from 'mongoose'
import { MongooseRepository } from './Repository'

type Salt = {
  salt: string
  updatedAt: Date
}

const SaltSchema = new Schema<Salt & Document>(
  { salt: { type: String, required: true } },
  { timestamps: { createdAt: false, updatedAt: true }, versionKey: false }
)

const SaltModel =
  (process.env.NODE_ENV === 'development' ? mongoose.models.Salt : null) ||
  mongoose.model('Salt', SaltSchema, 'salt')

export const SaltRepository = new MongooseRepository<Salt>(SaltModel)
