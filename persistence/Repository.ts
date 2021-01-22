import { Document, Model } from 'mongoose'

type Repository<DOCUMENT> = {
  find(filter?: object, projection?: object): AsyncIterable<Partial<DOCUMENT>>
  findOne(filter?: object, projection?: object): Promise<Partial<DOCUMENT>>
  upsert(filter: object, doc: object): Promise<void>
  existsOrInsert(filter, projection, doc): Promise<boolean> // exsert
}

export class MongooseRepository<DOCUMENT> implements Repository<DOCUMENT> {
  constructor(private model: Model<DOCUMENT & Document>) {}

  find(filter?: object, projection?: object): AsyncIterable<Partial<DOCUMENT>> {
    return this.model.find(filter, projection).lean().cursor()
  }

  findOne(filter?: object, projection?: object): Promise<Partial<DOCUMENT>> {
    return this.model.findOne(filter, projection).lean().exec() as Promise<
      Partial<DOCUMENT>
    >
  }

  upsert(filter: object, doc: object): Promise<void> {
    return this.model.updateOne(filter, doc, { upsert: true }).exec()
  }

  existsOrInsert(filter: any, doc: any, projection?: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.model
        .findOneAndUpdate(filter, doc, {
          upsert: true,
          projection,
        })
        .lean()
        .exec()
        .then((result) => resolve(!!result))
    })
  }
}
