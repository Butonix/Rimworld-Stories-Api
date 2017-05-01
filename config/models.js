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
    facebook: {
        id: {type: String},
        token: {type: String}
    }
});
/*
UserSchema.methods.apiRepr = function() {
    return {
        username: this.username || '',
        email: this.email || '',
        password: this.password || '',
        id: this._id,
        FBId: this.facebook.id || '',
        FBToken: this.facebook.token || '',
        authType: this.authType || '',
        rating: this.rating || ''
    };
};

UserSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
};*/

// STORY SCHEMA
const StorySchema = mongoose.Schema({
    title: { type: String, required: true },
    datePosted: { type: Date, required: true },
    story: { type: String, required: true },
    status: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    strict: 'throw'
});

const User = mongoose.model('User', UserSchema);
const Story = mongoose.model('Request', StorySchema);

module.exports = {User, Story};
