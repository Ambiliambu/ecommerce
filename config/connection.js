const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    //    const url=process.env.MONGOURL
//    const url='mongodb+srv://ambili:ambili123@cluster0.qgohy8b.mongodb.net/?retryWrites=true&w=majority'
//    const url='mongodb+srv://ambilipakhd:ambilipakhd123@cluster0.yosvbwy.mongodb.net/?retryWrites=true&w=majority'
      const url='mongodb+srv://akashpa:akashpa@cluster0.fecc2dy.mongodb.net/?retryWrites=true&w=majority'

    const dbname='shoppings'
console.log("kkk");

    mongoClient.connect(url,(err,data)=>{
        if(err)  return done(err)
        state.db=data.db(dbname)
        done()

    })
   
}
module.exports.get=function(){
    return state.db
}