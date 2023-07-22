const { Schema, model } = require("mongoose");

const PortSchema = Schema({
    date:{
        type:String,
    },
    mac:{
        type:String,
    },
    ip:{
        type:String,
    },
    ports:[{
        _attributes:{},
        state:{
            _attributes:{
                state:{
                    type:String,
                },
            },
        },
        service:{
            _attributes:{
                name:{
                    type:String,
                },
            },
        },
    }],
    
    
});
module.exports = model('monitoreo_red.hostnmaps', PortSchema);