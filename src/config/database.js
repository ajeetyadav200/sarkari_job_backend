const mongoose = require('mongoose')

const mongoose_url = process.env.DATABASE_URL

console.log(mongoose_url)

exports.connection_database =  async()=>{
    mongoose.connect(mongoose_url)
}

