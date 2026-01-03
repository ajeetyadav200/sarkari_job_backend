const mongoose = require('mongoose')

const mongoose_url = process.env.DATABASE_URL



exports.connection_database =  async()=>{
    mongoose.connect(mongoose_url)
}