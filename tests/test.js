var chai = require('chai'), chaiHttp = require('chai-http');
chai.use(chaiHttp);
md5 = require('md5')
var expect = chai.expect;
var base_url = 'localhost:3000';
var jwt_token = ''

describe("Login and save jwt globally", function(){
it("Login", function(done){
    data = {'username': 'arvind', 'password': 'test'}
    chai.request(base_url)
    .post('/login')
    .send(data)
    .end(function(err, res){
        expect(res.status).to.equal(200)
        jwt_token = res.headers['access_token']
        done()
    })
})
});

describe("Image Thumbnail", function(){
    let suite_uri = '/image_thumbnail'
    it("Get image with thumbnail - PNG", function(done){
        image_data = 'http://www.acadecap.org/wp-content/uploads/2016/07/Javascript.png'
        chai.request(base_url)
    .get(suite_uri+'?image_url='+image_data)
    .set('authorization',jwt_token)
    .send(data)
    .end(function(err, res){
        expect(res.type).to.equal('image/png')
        // MD5 hashing takes a little time here 
        expect(md5(res.body)).to.equal('6b50f6471757ccd953b6659e0503798c')
        expect(res.status).to.equal(200)
        done()
    })
    })
    it("Get image with thumbnail - JPG", function(done){
        image_data = 'https://i.pinimg.com/originals/2b/7e/e7/2b7ee7c7fa41af90105c7330b93df67c.jpg'
        chai.request(base_url)
    .get(suite_uri+'?image_url='+image_data)
    .set('authorization',jwt_token)
    .send(data)
    .end(function(err, res){
        expect(res.type).to.equal('image/png')
        // MD5 hashing takes a little time here 
        expect(md5(res.body)).to.equal('74a233776ad56e8d39d2089bd40a4a44')
        expect(res.status).to.equal(200)
        done()
    })
    })
    it("Failure - Get image with thumbnail", function(done){
        image_data = ''
        chai.request(base_url)
    .get(suite_uri+'?image_url='+image_data)
    .set('authorization',jwt_token)
    .send(data)
    .end(function(err, res){
        expect(res.body['data']).to.equal(null)
        expect(res.body['success']).to.equal(false)
        expect(res.body['message']).to.equal('image_url field is required.')
        expect(res.status).to.equal(400)
        done()
    })
    })

})

describe("Post Json and patch", function() {
    let suite_uri = '/json_patch'
    it("Success - Get the patched json - Add, Copy, Replace, Remove", function(done) {
        data = {
            json_object : {'name' : 'Jake'},
            json_patch_object : [{'op': 'add', 'path': '/age', 'value' : 23},
            {'op': 'add', 'path': '/dob', 'value' : '23-01-95'},
            {'op': 'add', 'path': '/date_of_birth', 'value' : ''},
            {'op': 'copy', 'from': '/dob', 'path' : '/date_of_birth'},
            {'op':'replace','path':'/name','value':'John'},
            {'op':'remove','path':'/dob'}]
        }
            chai.request(base_url)
        .post(suite_uri)
        .set('authorization',jwt_token)
        .send(data)
        .end(function (err, res){
            expect(res.body['data']).to.deep.equal({name:'John', age:23, date_of_birth: '23-01-95'})
            expect(res.status).to.equal(200)
            expect(res.body['success']).to.equal(true)
            expect(res.body['message']).to.equal(null)
            done();
        });
    });
    it("Success - Get the patched json - Move", function(done) {
        data = {
            json_object : {'name' : 'John'},
            json_patch_object : [{'op': 'add', 'path': '/age', 'value' : 23},
            {'op': 'add', 'path': '/dob', 'value' : '23-01-95'},
            {'op': 'add', 'path': '/date_of_birth', 'value' : ''},
            {'op': 'move', 'from': '/dob', 'path' : '/date_of_birth'}]
        }
            chai.request(base_url)
        .post(suite_uri)
        .set('authorization',jwt_token)
        .send(data)
        .end(function (err, res){
            expect(res.body['data']).to.deep.equal({name:'John', age:23, date_of_birth: '23-01-95'})
            expect(res.status).to.equal(200)
            expect(res.body['success']).to.equal(true)
            expect(res.body['message']).to.equal(null)
            done();
        });
    });
    it("Failure - Patch object not in array", function(done) {
        data = {
            json_object : {'name' : 'arvind'},
            json_patch_object : {'op': 'add', 'path': '/age', 'value' : 23}
        }
            chai.request(base_url)
        .post(suite_uri)
        .set('authorization',jwt_token)
        .send(data)
        .end(function (err, res) {
            expect(res.body['data']).to.equal(null)
            expect(res.status).to.equal(400)
            expect(res.body['success']).to.equal(false)
            expect(res.body['message']).to.equal('Patch must be an array of operations')
            done();
        });
    });
    it("Failure - Json patch - Test", function(done) {
        data = {
            json_object : {'name' : 'arvind'},
            json_patch_object : [{'op': 'test', 'path': '/age', 'value' : 23}]
        }
            chai.request(base_url)
        .post(suite_uri)
        .set('authorization',jwt_token)
        .send(data)
        .end(function (err, res) {
            expect(res.body['data']).to.equal(null)
            expect(res.status).to.equal(400)
            expect(res.body['success']).to.equal(false)
            expect(res.body['message']).to.equal('Path not found in document')
            done();
        });
    });
    it("Failure - Without '/' on path ", function(done) {
        data = {
            json_object : {'name' : 'arvind'},
            json_patch_object : [{'op': 'add', 'path': 'age', 'value' : 23}]
        }
            chai.request(base_url)
        .post(suite_uri)
        .set('authorization',jwt_token)
        .send(data)
        .end(function (err, res) {
            expect(res.body['data']).to.equal(null)
            expect(res.status).to.equal(400)
            expect(res.body['success']).to.equal(false)
            expect(res.body['message']).to.equal('JSONPointer must start with a slash (or be an empty string)!')
            done();
        });
    });
});
