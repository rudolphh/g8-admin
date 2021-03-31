const mongoose = require('mongoose')
const Schema = mongoose.Schema

const queryModel = new Schema({
    firstname:{type:String},
    lastname:{type:String},
    email:{type:String},
    query:{type:String}
})

// model name : querylist
// collection name : query_list
module.exports = mongoose.model('querylist', queryModel, 'query_list')