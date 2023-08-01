const Transactions = require('../models/transactionsModel');

async function post(req, res) {
    try {
        const {
            username,
            password,
            email,
            name,
            address,
            city,
            state,
            zip,
            country,
            order_id,
            transaction_id,
            currency,
            ipaddress,
            amount,
            localamount,
            reseller,
            site,
            pi_code,
            session_id,
            payment_subtype
        } = req.body;

        if (!username) res.status(400).send({ msg: "username required" });
        if (!password) res.status(400).send({ msg: "password required" });
        if (!email) res.status(400).send({ msg: "email required" });
        if (!name) res.status(400).send({ msg: "name required" });
        if (!address) res.status(400).send({ msg: "address required" });
        if (!city) res.status(400).send({ msg: "city required" });
        if (!state) res.status(400).send({ msg: "state required" });
        if (!zip) res.status(400).send({ msg: "zip required" });
        if (!country) res.status(400).send({ msg: "country required" });
        if (!order_id) res.status(400).send({ msg: "order_id required" });
        if (!transaction_id) res.status(400).send({ msg: "transaction_id required" });
        if (!currency) res.status(400).send({ msg: "currency required" });
        if (!ipaddress) res.status(400).send({ msg: "ipaddress required" });
        if (!amount) res.status(400).send({ msg: "amount required" });
        if (!localamount) res.status(400).send({ msg: "localamount required" });
        if (!reseller) res.status(400).send({ msg: "reseller required" });
        if (!site) res.status(400).send({ msg: "site required" });
        if (!pi_code) res.status(400).send({ msg: "pi_code required" });
        if (!session_id) res.status(400).send({ msg: "session_id required" });
        if (!payment_subtype) res.status(400).send({ msg: "payment_subtype required" });

        await Transactions.create(req.body)
        return res.status(200).send({ success: "OK" })
    } catch (error) {
        return res.status(200).send(error)
    }
}

module.exports = {
    post,
}