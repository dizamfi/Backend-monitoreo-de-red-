const { Schema, model } = require("mongoose");

const PortSchema = Schema({
    service: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    }
});