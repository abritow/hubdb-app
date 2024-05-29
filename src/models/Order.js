const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
	{
		subscriptionId: {
			type: Number
		},
		accountId: {
			type: Number
		},
		name: {
			type: String
		},
		email: {
			type: String
		},
		status: {
			type: String
		},
		payload: {
			type: String
		},
		used: {
			type: Boolean
		},
		paymentId: {
			type: Number
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
		}
	},
	{timestamps: true}
);

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
