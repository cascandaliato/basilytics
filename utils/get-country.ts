import maxmind, { CountryResponse } from 'maxmind'
import path from 'path'

export const getCountry = async (ip: string): Promise<string> => {
  const geoLiteDB = path.join(path.resolve('./public'), 'GeoLite2-Country.mmdb')
  const lookup = await maxmind.open<CountryResponse>(geoLiteDB)
  return lookup.get(ip)?.country.names.en
}
