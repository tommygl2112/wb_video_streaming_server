const mongoose = require("mongoose");

const transactionsSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zip: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    order_id: {
        type: String,
        required: true,
    },
    transaction_id: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    ipaddress: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    localamount: {
        type: Number,
        required: true,
    },
    reseller: {
        type: String,
        required: true,
    },
    site: {
        type: String,
        required: true,
    },
    pi_code: {
        type: String,
        required: true,
    },
    session_id: {
        type: String,
        required: true,
    },
    payment_subtype: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("Transactions", transactionsSchema);
