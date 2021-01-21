import mongoose from 'mongoose'

export const dbConnection = mongoose.connect(
  process.env.MONGODB_CONNECTION_STRING,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    // autoIndex: false,
  }
)
