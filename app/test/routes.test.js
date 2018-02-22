const routes = require('../routes/index');
const request = require('supertest');
let app = require('../app');
require('should');

describe('routes', () => {

  it('send api',  (done) => {

    request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect((res) => {
        res.status.should.equal(200);
        res.text.should.equal('[]');
      })
      .end((err, res) => {
        if(err){
          throw err;
        }
        done();
      });

  });

});


