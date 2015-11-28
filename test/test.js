const chai = require('chai')
const expect = chai.expect
const traverseModule = require('./traverse.js')
const traverse = traverseModule.traverse
const missing = traverseModule.missing
console.log(traverse, missing)

function deepEqual(a, b) {
  var result = true
  function cmp(a, b) {
    if (a !== b) {
      result = false
      return true
    }
  }

  traverse(a, b, cmp)
  return result
}

function debugCompareScalars(logs, a, b, path) {
  if (a === b) {
    return
  }

  if (b === missing) {
    logs.push('key removed `' + path + '`')
    return
  }

  if (a === missing) {
    logs.push('key added `' + path + '`')
    return
  }

  if (typeof(a) !== typeof(b)) {
    logs.push('different types at `' + path + '`')
    return
  }

  if (typeof(a) === 'function') {
    logs.push('changed value at `' + path + '` (different functions)')
    return
  }

  logs.push('changed value at `' + path + '`')
}

function debugCompareObjects(logs, a, b, path) {
  // go one level deep on any object, because we want to learn about
  // individual keys of props and state
  if (path === '') {
    return false
  }

  if (a !== b && deepEqual(a, b)) {
    logs.push('changed value at `' + path + '` (deeply equal but different instance)')
    return true // no need to inspect deeper, it's all equal
  }
}


function debugCompare(a, b, logs) {
  logs = logs || []

  if (typeof(a) !== typeof(b)) {
    logs.push('different types')
    return false
  }

  if (typeof(a) === 'function') {
    if (a === b) {
      return true
    } else {
      logs.push('different functions')
      return false
    }
  }

  if (typeof(a) === 'object')
  {
    traverse(a, b,
      debugCompareScalars.bind(null, logs),
      debugCompareObjects.bind(null, logs))
  }

  return a === b
}

const dc = debugCompare

function expect_logs(a, b, expected_logs) {
  const logs = []
  debugCompare(a, b, logs)
  expect(logs).to.deep.equal(expected_logs)
}


describe('debugCompare', () => {
  it('returns true for equal scalars', () => {
    expect(dc(1, 1)).to.be.true
    expect(dc('a', 'a')).to.be.true
    expect(dc(null, null)).to.be.true
    expect(dc(undefined, undefined)).to.be.true
  })

  it('compares functions using instance equality', () => {
    const f1 = () => {}
    const f2 = () => {}
    expect(dc(f1, f1)).to.be.true
    expect(dc(f1, f2)).to.be.false

    expect_logs(f1, f2, ['different functions'])
  })

  it('uses type-aware comparisons', () => {
    expect(dc(1, '1')).to.be.false
    expect_logs(1, '1', ['different types'])
  })

  it('returns false different scalars', () => {
    expect(dc(1, 2)).to.be.false
    expect(dc('a', '')).to.be.false
    expect(dc(undefined, null)).to.be.false
  })

  it('returns true for same objects', () => {
    const o = {}
    expect(dc(o, o)).to.be.true
  })

  it('returns false for different objects', () => {
    expect(dc({a: 1}, {b: 1})).to.be.false
  })

  it('reports removed keys', () => {
    expect_logs({a: 1}, {}, ['key removed `.a`'])
    expect_logs({c: 1}, {}, ['key removed `.c`'])
  })

  it('reports added keys', () => {
    expect_logs({}, {a: 1}, ['key added `.a`'])
    expect_logs({}, {b: 2}, ['key added `.b`'])
  })

  it('reports changed keys', () => {
    expect_logs({a: 1}, {a: 2}, ['changed value at `.a`'])
  })

  it('reports different instances of equal objects', () => {
    expect_logs({a: {}}, {a: {}},
      ['changed value at `.a` (deeply equal but different instance)']
    )
  })

  it('reports as much as possible', () => {
    expect_logs({a: 1, c: {}}, {b: 2, c: {}},
      [
        'key removed `.a`',
        'changed value at `.c` (deeply equal but different instance)',
        'key added `.b`',
      ]
    )
  })

  it('reports when finds different functions', () => {
    const f1 = () => {}
    const f2 = () => {}
    expect_logs({a: f1}, {a: f2},
      [
        'changed value at `.a` (different functions)',
      ]
    )
  })

  it('reports different functions at any level', () => {
    const f1 = () => {}
    const f2 = () => {}
    expect_logs({a: {b: {c: f1}}}, {a: {b: {c: f2}}},
      [
        'changed value at `.a.b.c` (different functions)'
      ]
    )
  })
})
