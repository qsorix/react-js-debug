const chai = require('chai');
const expect = chai.expect;

function deepEqual(a, b) {
  if (typeof(a) !== 'object' || typeof(b) !== 'object') {
    return a === b;
  }

  for (key in a) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

function debugCompare(a, b, logs) {
  logs = logs || []
  if (typeof(a) === 'object' && typeof(b) === 'object')
  {
    for (key in a) {
      if (!b.hasOwnProperty(key)) {
        logs.push('key removed `' + key + '`')
      } else {
        if (a[key] !== b[key]) {
          if (deepEqual(a[key], b[key])) {
            logs.push('same value but different instance at `' + key + '`')
          } else {
            logs.push('changed value of `' + key + '`')
          }
        }
      }
    }
    for (key in b) {
      if (!a.hasOwnProperty(key)) {
        logs.push('key added `' + key + '`')
      }
    }
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

  it('uses type-aware comparisons', () => {
    expect(dc(1, '1')).to.be.false
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
  });

  it('reports removed keys', () => {
    expect_logs({a: 1}, {}, ['key removed `a`'])
    expect_logs({c: 1}, {}, ['key removed `c`'])
  });

  it('reports added keys', () => {
    expect_logs({}, {a: 1}, ['key added `a`'])
    expect_logs({}, {b: 2}, ['key added `b`'])
  });

  it('reports changed keys', () => {
    expect_logs({a: 1}, {a: 2}, ['changed value of `a`'])
  });

  it('reports different instances of equal objects', () => {
    expect_logs({a: {}}, {a: {}},
      ['same value but different instance at `a`']
    );
  });

});
