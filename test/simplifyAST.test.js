'use strict';

var chai = require('chai')
  , expect = chai.expect
  , helper = require('./helper')
  , sequelize = helper.sequelize
  , Sequelize = require('sequelize')
  , parser = parse = require('graphql/lib/language/parser').parse
  , parse = function (query) {
      return parser(query).definitions[0];
    }
  , simplifyAST = require('../src/simplifyAST');

describe('simplifyAST', function () {
  it('should simplify a basic nested structure', function () {
    expect(simplifyAST(parse(`
      {
        users {
          name
          projects {
            name
          }
        }
      }
    `))).to.deep.equal({
      args: {},
      fields: {
        users: {
          args: {},
          fields: {
            name: {
              args: {},
              fields: {}
            },
            projects: {
              args: {},
              fields: {
                name: {
                  args: {},
                  fields: {}
                }
              }
            }
          }
        }
      }
    });
  });

  it('should simplify a basic structure with args', function () {
    expect(simplifyAST(parse(`
      {
        user(id: 1) {
          name
        }
      }
    `))).to.deep.equal({
      args: {},
      fields: {
        user: {
          args: {
            id: "1"
          },
          fields: {
            name: {
              args: {},
              fields: {}
            }
          }
        }
      }
    });
  });

  it('should expose a $parent', function () {
    var ast = simplifyAST(parse(`
      {
        users {
          name
          projects(first: 1) {
            nodes {
              name
            }
          }
        }
      }
    `));

    expect(ast.fields.users.fields.projects.fields.nodes.$parent).to.be.ok;
    expect(ast.fields.users.fields.projects.fields.nodes.$parent.args).to.deep.equal({
      first: '1'
    });
  });

  it('should simplify a nested structure at the lowest level', function () {
    expect(simplifyAST(parse(`
      {
        users {
          name
          projects {
            node {
              name
            }
            node {
              id
            }
          }
        }
      }
    `))).to.deep.equal({
      args: {},
      fields: {
        users: {
          args: {},
          fields: {
            name: {
              args: {},
              fields: {}
            },
            projects: {
              args: {},
              fields: {
                node: {
                  args: {},
                  fields: {
                    name: {
                      args: {},
                      fields: {}
                    },
                    id: {
                      args: {},
                      fields: {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  it('should simplify a nested structure duplicated at a high level', function () {
    expect(simplifyAST(parse(`
      {
        users {
          name
          projects {
            node {
              name
            }
          }
          projects {
            node {
              id
            }
          }
        }
      }
    `))).to.deep.equal({
      args: {},
      fields: {
        users: {
          args: {},
          fields: {
            name: {
              args: {},
              fields: {}
            },
            projects: {
              args: {},
              fields: {
                node: {
                  args: {},
                  fields: {
                    name: {
                      args: {},
                      fields: {}
                    },
                    id: {
                      args: {},
                      fields: {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  });
});