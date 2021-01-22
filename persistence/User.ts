import mongoose, { Document, Schema } from 'mongoose'
import { MongooseRepository } from './Repository'

type User = {
  id: string
  siteIds?: string[]
}

const UserSchema = new Schema<User & Document>(
  {
    id: { type: String, required: true },
    siteIds: [String],
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

UserSchema.index({ id: 1 }, { unique: true })
UserSchema.index({ siteIds: 1 })

const UserModel =
  (process.env.NODE_ENV === 'development'
    ? mongoose.models.UserSchema
    : null) || mongoose.model('User', UserSchema)

export const UserRepository = new MongooseRepository<User>(UserModel)
