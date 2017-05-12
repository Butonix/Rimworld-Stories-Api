const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// USER SCHEMA
const UserSchema = mongoose.Schema({
    username: { type: String, required: true },
    authType: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    banned: { type: Boolean, default: false },
    avatarUrl: { type: String },
    facebook: {
        id: {type: String},
        token: {type: String}
    }
});

UserSchema.methods.myProfileRep = function(stories) {
    return {
        username: this.username || '',
        email: this.email || '',
        id: this._id,
        avatarUrl: this.avatarUrl || '',
        stories
    };
};

UserSchema.methods.otherProfileRep = function(stories) {
    return {
        username: this.username || '',
        id: this._id,
        avatarUrl: this.avatarUrl || '',
        stories
    };
};

// STORY SCHEMA
const StorySchema = mongoose.Schema({
    title: { type: String },
    datePosted: { type: Date, default: Date.now },
    story: { type: String },
    status: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    screenshot: { type: String },
    views: { type: Number, default: 0 },
    stars: { type: Array }
}, {
    strict: 'throw'
});

// COMMENT SCHEMA
const CommentSchema = mongoose.Schema({
    datePosted: { type: Date, default: Date.now },
    comment: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true }
}, {
    strict: 'throw'
});

const User = mongoose.model('User', UserSchema);
const Story = mongoose.model('Story', StorySchema);
const Comment = mongoose.model('Comment', CommentSchema);

module.exports = {User, Story, Comment};
