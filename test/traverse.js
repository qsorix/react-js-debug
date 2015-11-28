const chai = require('chai')
const expect = chai.expect

// acts as a unique value that is different than null and undefined
function missing(){}

// TODO: rename to shapefulZipWith
// applied f to all pairs of values at a and b
// if f returns true, stops recursive traversal
function traverse(a, b, fs, fo, path) {
  var key

  path = path || ''

  if (typeof(a) !== 'object' || typeof(b) !== 'object') {
    return fs(a, b, path)
  }

  if (fo !== undefined)
  {
    if (fo(a, b, path)) {
      return
    }
  }

  for (key in a) {
    if (!b.hasOwnProperty(key)) {
      if (fs(a[key], missing, path+'.'+key)) {
        return true
      }
    } else {
      if (traverse(a[key], b[key], fs, fo, path+'.'+key)) {
        return true
      }
    }
  }
  for (key in b) {
    if (!a.hasOwnProperty(key)) {
      if (fs(missing, b[key], path+'.'+key)) {
        return true
      }
    }
  }
  return false
}


describe('traverse', () => {
  var log = []
  function logger(a, b, path) {
    log.push([a, b, path])
  }

  beforeEach(() => {
    log = []
  })

  it('applies f to arguments', () => {
    traverse(1, 2, logger)
    expect(log).to.deep.equal([[1, 2, '']])
  })

  it('goes into objects', () => {
    traverse({a: 1}, {a: 2}, logger)
    expect(log).to.deep.equal([[1, 2, '.a']])
  })

  it('goes into lists', () => {
    traverse([1, 2], [3, 4], logger)
    expect(log).to.deep.equal([[1, 3, '.0'], [2, 4, '.1']])
  })

  it('applies f with a marker when left argument is missing', () => {
    traverse({}, {a: 1}, logger)
    expect(log).to.deep.equal([[missing, 1, '.a']])
  })

  it('applies f with a marker when right argument is missing', () => {
    traverse({a: 1}, {}, logger)
    expect(log).to.deep.equal([[1, missing, '.a']])
  })

  it('recursively traverses objects', () => {
    traverse({a: {b: {c: 1}}}, {a: {b: {c: 2}}}, logger)
    expect(log).to.deep.equal([[1, 2, '.a.b.c']])
  })

  it('stops iteration when f returns true', () => {
    function stops(a, b, path) {
      logger(a, b, path)
      if (a === 2) {
        return true
      }
    }
    traverse([1, 2, 3], [1, 2, 3], stops)
    expect(log).to.deep.equal([
      [1, 1, '.0'],
      [2, 2, '.1']
    ])
  })

  it('visits objects before traversing them', () => {
    const k = {a: 1, b: {c: {d: 1}}}
    const l = {a: 2, b: {c: {d: 2}}}
    traverse(k, l, logger, logger)
    expect(log).to.deep.equal([
      [k,       l,       ''],
      [k.a,     l.a,     '.a'],
      [k.b,     l.b,     '.b'],
      [k.b.c,   l.b.c,   '.b.c'],
      [k.b.c.d, l.b.c.d, '.b.c.d'],
    ])
  })

  it('does not desced if visiting object returned true', () => {
    function stops(a, b, path) {
      logger(a, b, path)
      if (path === '.b.c') {
        return true
      }
    }

    const k = {a: 1, b: {c: {d: 1}}}
    const l = {a: 2, b: {c: {d: 2}}}
    traverse(k, l, logger, stops)
    expect(log).to.deep.equal([
      [k,       l,       ''],
      [k.a,     l.a,     '.a'],
      [k.b,     l.b,     '.b'],
      [k.b.c,   l.b.c,   '.b.c'],
    ])
  })
})

exports.traverse = traverse
exports.missing = missing
