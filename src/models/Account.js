const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema(
	{
		accountId: {
			type: Number,
			index: {unique: true}
		},
		refreshToken: {
			type: String,
			required: true
		},
		accessToken: {
			type: String
		},
		tokenExpiresAt: {
			type: Date
		},
		userEmail: {
			type: String,
			required: true
		},
		userId: {
			type: Number,
			required: true
		},
		appStatus: {
			type: String,
			enum: ['active', 'inactive', 'trial'],
			default: 'inactive',
			required: true
		},
		plan: {
			type: String,
			enum: ['monthly', 'annually', 'free']
		},
		isRoot: {
			type: Boolean,
			default: false
		},
		numberOfUses: {
			type: Number,
			default: 0
		},
		allowedUsers: {
			type: String,
			enum: ['owner', 'any'],
			default: 'owner'
		},
		language: {
			type: String,
			default: 'en'
		},
		disableAt: {
			type: Date,
			default: null
		},
		createdAt: {
			type: Date
		},
		updatedAt: {
			type: Date
		},
		activatedAt: {
			type: Date
		}
	},
	{timestamps: true}
);

const Account = mongoose.model('Account', AccountSchema);

module.exports = Account;
