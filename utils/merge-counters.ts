export const mergeCounters = (target: object, source: object): void => {
  for (const property in source) {
    if (!(property in target)) target[property] = source[property]
    else if (
      typeof source[property] === 'number' &&
      typeof target[property] === 'number'
    )
      target[property] += source[property]
    else if (
      typeof source[property] !== 'number' &&
      typeof target[property] !== 'number'
    )
      mergeCounters(target[property], source[property])
  }
}
