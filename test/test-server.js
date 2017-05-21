const chai = require('chai');
const chaiHttp = require('chai-http');
const {app, runServer, closeServer} = require('../server');
const faker = require('faker');
const mongoose = require('mongoose');
const FormData = require('form-data');
const fs = require('fs');

const superAgent = require('superagent');
const agent = superAgent.agent();

const should = chai.should();
const {Story, User, Comment} = require('../config/models');

chai.use(chaiHttp);

let user1 = {
	password: faker.name.lastName(),
	email: faker.internet.email(),
	id: '',
	iam: 'USER 1'
};
let user2 = {
	password: faker.name.lastName(),
	email: faker.internet.email(),
	id: '',
	iam: 'USER 2'
};
let testStoryID = '', testCommentID = '';

// Load either local config or regular config
if (fs.existsSync('./config/local')) {
    console.log('Loading LOCAL config for testing');
    loadConfig('../config/local/config.js');
} else {
    console.log('Loading REMOTE config for testing');
    loadConfig('../config/config.js');
}
function loadConfig (configPath) {
    return {TEST_DATABASE_URL} = require(configPath);
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

function logOut (done) {
	agent.get('http://127.0.0.1:8080/auth/log-out')
	.end((err, res) => {
		should.not.exist(err);
		done();
	});
}

function logIn (user) {
	return function(done) {
		agent.post('http://127.0.0.1:8080/auth/login')
			.send({
				password: user.password,
				email: user.email
	        })
			.end((err, res) => {
			    should.not.exist(err);
				done();
			});
	};
}

// MAIN TEST SUITE
describe('API', function() {

	before(function() {
        tearDownDb();
		return runServer(TEST_DATABASE_URL);
	});
	after(function() {
		return closeServer();
	});

	describe('GET story/get-list', function() {
		it('should get landing stories', function(done) {
			agent.post('http://127.0.0.1:8080/story/get-list')
				.send({
					filters: {
                        type: 'Most viewed',
                        perPage: 3,
                        page: 0
                    }
		        })
				.end((err, res) => {
				    res.should.not.have.status(401);
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
				});
		});
	});

	describe('POST auth/new', function() {
		it('should add 2 new users', function(done) {
            this.timeout(4000);
			agent.post('http://127.0.0.1:8080/auth/signup')
				.send({
					username: user1.iam,
					password: user1.password,
					email: user1.email
				})
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
				    return agent.post('http://127.0.0.1:8080/auth/signup')
						.send({
							username: user2.iam,
							password: user2.password,
							email: user2.email
						})
			  			.end((err, res) => {
						    should.not.exist(err);
						    res.should.have.status(200);
							return User.find()
								.then((users) => {
									user1.id = users[0]._id;
									user2.id = users[1]._id;
									done();
							  	});
			  			});
	  			});
		});
	});

	describe('POST auth/login', function() {
		it('should log in user1', function(done) {
			agent.post('http://127.0.0.1:8080/auth/login')
				.send({
					password: user1.password,
					email: user1.email
		        })
				.end((err, res) => {
				    res.should.not.have.status(401);
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
				});
		});
	});

	describe('GET story/get-draft/forceNew', function() {
		it('should save a new draft', function(done) {
			agent.get('http://127.0.0.1:8080/story/get-draft/forceNew')
	  			.end((err, res) => {
                    testStoryID = res.body.currentDraft._id;
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('POST story/save-draft', function() {
		it('should save current draft', function(done) {
			agent.post('http://127.0.0.1:8080/story/save-draft')
                .withCredentials()
				.send({
                    title: faker.lorem.sentence(),
                    story: faker.lorem.paragraphs(),
                    id: testStoryID,
                    status: 'draft'
                })
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('POST story/save-draft', function() {
		it('should publish current draft', function(done) {
			agent.post('http://127.0.0.1:8080/story/save-draft')
                .withCredentials()
				.send({
                    title: faker.lorem.sentence(),
                    story: faker.lorem.paragraphs(),
                    id: testStoryID,
                    datePosted: '10/10/10',
                    status: 'published'
                })
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('PUT story/update', function() {
		after(logOut);
		it('should publish current draft', function(done) {
			agent.put('http://127.0.0.1:8080/story/update')
                .withCredentials()
				.send({
                    title: faker.lorem.sentence(),
                    story: faker.lorem.paragraphs(),
                    id: testStoryID,
                    datePosted: '10/10/10',
                    status: 'published'
                })
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('POST comment/new-comment', function() {
		before(logIn(user2));
		it('should post a new comment', function(done) {
			agent.post('http://127.0.0.1:8080/comment/new-comment')
                .withCredentials()
				.send({
                    story: testStoryID,
                    comment: faker.lorem.paragraphs()
                })
	  			.end((err, res) => {
                    testCommentID = res.body.comments[0]._id;
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('DELETE comment/:id', function() {
		it('should delete comment', function(done) {
			agent.delete('http://127.0.0.1:8080/comment/' + testCommentID)
                .withCredentials()
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('POST story/star/:id', function() {
		it('should star story', function(done) {
			agent.post('http://127.0.0.1:8080/story/star/' + testStoryID)
                .withCredentials()
                .send({type: 'star'})
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('POST story/star/:id', function() {
		it('should Unstar story', function(done) {
			agent.post('http://127.0.0.1:8080/story/star/' + testStoryID)
                .withCredentials()
                .send({type: 'unstar'})
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

	describe('GET profile/get/:id', function() {
		it('should get profile', function(done) {
			agent.get('http://127.0.0.1:8080/profile/get/' + user2.id)
                .withCredentials()
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
				    res.body.should.be.an.Object;
					done();
	  			});
		});
	});

	describe('POST profile/change-username', function() {
		after(logOut);
		it('should change username', function(done) {
			agent.post('http://127.0.0.1:8080/profile/change-username')
                .withCredentials()
                .send({username: 'NEW USERNAME'})
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
				    res.body.should.be.an.Object;
					done();
	  			});
		});
	});

	describe('DELETE story/:id', function() {
		before(logIn(user1));
    	after(logOut);
		it('should delete a story', function(done) {
			agent.delete('http://127.0.0.1:8080/story/' + testStoryID)
                .withCredentials()
	  			.end((err, res) => {
				    should.not.exist(err);
				    res.should.have.status(200);
					done();
	  			});
		});
	});

});
