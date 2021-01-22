module.exports = {
  async redirects() {
    return [
      {
        source: '/GeoLite2-Country.mmdb',
        destination: 'https://dev.maxmind.com/geoip/geoip2/geolite2/',
        permanent: true,
      },
    ]
  },
}
