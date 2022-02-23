// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('runs commands in secondary domain', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')
      .should('equal', 'From a secondary domain')
    })

    cy.log('after switchToDomain')
  })

  it('passes runnable state to the secondary domain', () => {
    const runnable = cy.state('runnable')
    const expectedRunnable = {
      clearTimeout: null,
      isPending: null,
      resetTimeout: null,
      timeout: null,
      id: runnable.id,
      _currentRetry: runnable._currentRetry,
      type: 'test',
      title: 'passes runnable state to the secondary domain',
      titlePath: [
        'multi-domain',
        'passes runnable state to the secondary domain',
      ],
      parent: {
        id: runnable.parent.id,
        type: 'suite',
        title: 'multi-domain',
        titlePath: [
          'multi-domain',
        ],
        parent: {
          id: runnable.parent.parent.id,
          type: 'suite',
          title: '',
          titlePath: undefined,
          ctx: {},
        },
        ctx: {},
      },
      ctx: {},
    }

    cy.switchToDomain('foobar.com', [expectedRunnable], ([expectedRunnable]) => {
      const actualRunnable = cy.state('runnable')

      // these functions are set in the secondary domain so just set them on the expectedRunnable
      expectedRunnable.clearTimeout = actualRunnable.clearTimeout
      expectedRunnable.isPending = actualRunnable.isPending
      expectedRunnable.resetTimeout = actualRunnable.resetTimeout
      expectedRunnable.timeout = actualRunnable.timeout

      expect(actualRunnable.titlePath()).to.deep.equal(expectedRunnable.titlePath)
      expectedRunnable.titlePath = actualRunnable.titlePath

      expect(actualRunnable).to.deep.equal(expectedRunnable)
    })
  })

  it('passes viewportWidth/Height state to the secondary domain', () => {
    const expectedViewport = [320, 480]

    cy.viewport(320, 480).then(() => {
      const primaryViewport = [cy.state('viewportWidth'), cy.state('viewportHeight')]

      expect(primaryViewport).to.deep.equal(expectedViewport)
    })

    cy.switchToDomain('foobar.com', [expectedViewport], ([expectedViewport]) => {
      const secondaryViewport = [cy.state('viewportWidth'), cy.state('viewportHeight')]

      expect(secondaryViewport).to.deep.equal(expectedViewport)
    })
  })

  it('handles querying nested elements', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('form button')
      .invoke('text')
      .should('equal', 'Submit')
    })

    cy.log('after switchToDomain')
  })

  it('sets up window.Cypress in secondary domain', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="cypress-check"]')
      .invoke('text')
      .should('equal', 'Has window.Cypress')
    })
  })

  describe('data argument', () => {
    it('passes object to callback function', () => {
      cy.switchToDomain('foobar.com', [{ foo: 'foo', bar: 'bar' }], ([{ foo, bar }]) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
      })
    })

    it('passes array to callback function', () => {
      cy.switchToDomain('foobar.com', ['foo', 'bar'], ([foo, bar]) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
      })
    })

    it('passes string to callback function', () => {
      cy.switchToDomain('foobar.com', ['foo'], ([foo]) => {
        expect(foo).to.equal('foo')
      })
    })

    it('passes number to callback function', () => {
      cy.switchToDomain('foobar.com', [1], ([num]) => {
        expect(num).to.equal(1)
      })
    })

    it('passes boolean to callback function', () => {
      cy.switchToDomain('foobar.com', [true], ([bool]) => {
        expect(bool).to.be.true
      })
    })

    it('passes mixed types to callback function', () => {
      cy.switchToDomain('foobar.com', ['foo', 1, true], ([foo, num, bool]) => {
        expect(foo).to.equal('foo')
        expect(num).to.equal(1)
        expect(bool).to.be.true
      })
    })
  })

  describe('errors', () => {
    // @ts-ignore
    it('errors if experimental flag is not enabled', { experimentalMultiDomain: false }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires enabling the experimentalMultiDomain flag')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors if passed a non-string for the domain argument', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be a string. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors passing non-array to callback function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the \'data\' argument to be an array. You passed: `foo`')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', 'foo', () => {})
    })

    it('errors if passed a non-serializable data value', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('data argument specified is not serializable')

        if (Cypress.browser.family === 'chromium') {
          expect(err.message).to.include('HTMLDivElement object could not be cloned')
        } else if (Cypress.browser.family === 'firefox') {
          expect(err.message).to.include('The object could not be cloned')
        }

        done()
      })

      const el = document.createElement('div')

      cy.switchToDomain('foobar.com', ['foo', '1', el], () => {})
    })

    it('errors if last argument is absent', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com')
    })

    it('errors if last argument is not a function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: `{}`')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', {})
    })

    // TODO: Proper stack trace printing still needs to be addressed here
    it('propagates secondary domain errors to the primary that occur within the test', () => {
      return new Promise((resolve) => {
        cy.on('fail', (e) => {
          expect(e.message).to.equal('done is not defined')
          resolve(undefined)
        })

        cy.switchToDomain('foobar.com', () => {
          // done is not defined on purpose here as we want to test the error gets sent back to the primary domain correctly
          // @ts-ignore
          done()
        })
      })
    })

    it('propagates thrown errors in the secondary domain back to the primary w/ done', (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.equal('oops')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        throw 'oops'
      })
    })

    it('propagates thrown errors in the secondary domain back to the primary w/o done', () => {
      return new Promise((resolve) => {
        cy.on('fail', (e) => {
          expect(e.message).to.equal('oops')
          resolve(undefined)
        })

        cy.switchToDomain('foobar.com', () => {
          throw 'oops'
        })
      })
    })

    it('receives command failures from the secondary domain', (done) => {
      const timeout = 50

      cy.on('fail', (err) => {
        expect(err.message).to.include(`Timed out retrying after ${timeout}ms: Expected to find element: \`#doesnt-exist\`, but never found it`)
        //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
        expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
        expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
        done()
      })

      cy.switchToDomain('foobar.com', [timeout], ([timeout]) => {
        cy.get('#doesnt-exist', {
          timeout,
        })
      })
    })
  })
})
