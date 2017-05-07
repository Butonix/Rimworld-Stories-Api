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

UserSchema.methods.myProfileRep = function() {
    return {
        username: this.username || '',
        email: this.email || '',
        id: this._id,
        avatarUrl: this.avatarUrl || ''
    };
};

UserSchema.methods.otherProfileRep = function() {
    return {
        username: this.username || '',
        id: this._id,
        avatarUrl: this.avatarUrl || ''
    };
};

// STORY SCHEMA
const StorySchema = mongoose.Schema({
    title: { type: String },
    datePosted: { type: Date, default: Date.now },
    story: { type: String },
    status: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    strict: 'throw'
});

const User = mongoose.model('User', UserSchema);
const Story = mongoose.model('Story', StorySchema);

module.exports = {User, Story};
