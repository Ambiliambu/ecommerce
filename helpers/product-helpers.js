var db=require('../config/connection') 
var collection=require('../config/collections')
const async = require('hbs/lib/async')
const { status } = require('express/lib/response')
var objectId=require('mongodb').ObjectId
let moment=require('moment')
const res = require('express/lib/response')
const { response } = require('../app')


module.exports={
    addProduct:(product,callback)=>{
        product={
            Name:product.Name,
            Category:product.Category,
            Price:parseInt(product.Price),
            Description:product.Description,

        }
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async (resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    deleteProduct:(prodId)=>{
       return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
               resolve(response)
           })
       })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    Price:parseInt(proDetails.Price),
                    Description:proDetails.Description
                }
            }).then((response)=>{
                resolve()
            })
        })
    }, 
    getAllUsers:()=>{
        return new Promise(async (resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })

    },
    addCategory:(category,callback)=>{
        db.get().collection('category').insertOne(category).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllCategories:()=>{
        return new Promise(async (resolve,reject)=>{
            let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },
    deleteCategory:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(categoryId)}).then((response)=>{
              resolve(response)
            })
        })
     },

     findProduct:(proId)=>{
        return new Promise(async(resolve,reject)=>{
         let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
         resolve(product)
        
        })
      },

     updateUserblock:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {$set:{
               Status:false
            }
           
           }).then((response)=>{
               resolve(response)
           })
        })
    },
     updateUserunblock:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {$set:{
               Status:true
            }
           
           }).then((response)=>{
               resolve(response)
           })
        })
    },
    getAllOrders:()=>{
        return new Promise(async (resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().sort({$natural:-1}).toArray()
            resolve(orders)
        })
    },
    getAllOrder:(startDate,endDate)=>{
                 
        let end= moment(endDate).format('YYYY-MM-DD')
        let start=moment(startDate).format('YYYY-MM-DD')
        return new Promise(async (resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).sort({$natural:-1}).toArray()
            resolve(orders)
        })
    },


  






    
    cancelOrders:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId(orderId)},{
            $set:{
                status:false
            }
        }).then((response)=>{
            resolve(response)
        })
        })
      
    },
    updateStatus:(orderId,newStatus,cancelStatus,delivaryStatus)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:newStatus,
                    cancel:cancelStatus,
                    delivary:delivaryStatus
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },
    addproOffer:(proOffer)=>{
        return new Promise(async (resolve,reject)=>{
             proOffer.startDate=moment(proOffer.startDate).format('YYYY-MM-DD')
             proOffer.endDate=moment(proOffer.endDate).format('YYYY-MM-DD')

             let response={};

          let existpro =await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:proOffer.Name,offer:{ $exists:true}});
          if(existpro){
              response.exist=true;
              resolve(response)
          }else{
              db.get().collection(collection.PRODUCT_OFFERS).insertOne(proOffer).then((response)=>{
                  resolve(response)
              }).catch((err)=>{
                  reject(err)
              })
          }
        })
    }, getAllProductOffer:()=>{
        return new Promise( async(resolve,reject)=>{
          let productOffer=await db.get().collection(collection.PRODUCT_OFFERS).find().sort({$natural:-1}).toArray()
          resolve(productOffer)
        })
    },
   startProductOffer:(todayDate)=>{
       let proStartDate=moment(todayDate).format('YYYY-MM-DD')
       return new Promise(async (resolve,reject)=>{
           let data=await db.get().collection(collection.PRODUCT_OFFERS).find({startDate:{$lte:proStartDate}}).toArray();
           if(data){
               await data.map(async(oneData)=>{
                   let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:oneData.Name,offer:{$exists:false}})
                   if(product){
                       let actualPrice=product.Price  
                       let newP=(((product.Price)*(oneData.offerPercent))/100);
                       let newPrice=actualPrice-newP;

                       newPrice=newPrice.toFixed()

                       db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(product._id)},{
                           $set:{
                               actualPrice:actualPrice,
                               Price:newPrice,
                               offer:true,
                               offerPer:oneData.offerPercent
                           }
                       })
                       resolve()

                   }else{
                       resolve()
                   }
               })
           }else{
               resolve()
           }
       })
   },
   deleteProductOffer:(Id)=>{
       return new Promise(async(resolve,reject)=>{
           let proOffer=await db.get().collection(collection.PRODUCT_OFFERS).findOne({_id:objectId(Id)})
           let proOfferName=proOffer.Name;

           let Product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:proOfferName})

           db.get().collection(collection.PRODUCT_OFFERS).deleteOne({_id:objectId(Id)})
           db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:proOfferName},{
               $set:{
                   Price:Product?.actualPrice
               },
               $unset:{
                   actualPrice:"",
                   offer:"",
                   offerPer:""
               }

           }).then((response)=>{
               resolve(response)
           }).catch((err)=>{
               reject(err)
           })
       })
   },
   monthlyReport:()=>{
    return new Promise(async(resolve,reject)=>{   
        let today=new Date()
        let end= moment(today).format('YYYY-MM-DD')
        let start=moment(end).subtract(30,'days').format('YYYY-MM-DD')
        let orderShipped= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:"Shipped"}).toArray()
        let orderPlaced= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:"placed"}).toArray()
        let orderPending= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status: 'failed'}).toArray()

        let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
        let cancelOrder=await db.get().collection(collection.ORDER_COLLECTION).find({status:'Cancelled',date:{$gte:start,$lte:end}}).toArray()
        let allUser=await db.get().collection(collection.USER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
        let razorPay=await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"RazorPay"}).toArray()
        let payPal=await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"PayPal"}).toArray()
        let cod =await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"COD"}).toArray()
        let deliveredOrder=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Delivered'}).toArray()
        let totalAmount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
         {
            $match:{$and:[{status:{$ne:'Cancelled'}},{status:{$ne:'failed'}}]}                             
         },
          {
            $group:{
              _id:null,
              total:{$sum:"$totalAmount"}
            }
          }
        ]).toArray()
        let payPalLength=payPal.length;
        let razorPayLength=razorPay.length;
        let codLength=cod.length;
        let allProducts=products.length;
        let totalUsers=allUser.length;
        let orderShippedLength = orderShipped.length;
        let orderTotalLength = orderTotal.length;
        let orderFailLength = orderPending.length;
        let cancelTotal=cancelOrder.length
        let total=totalAmount[0]?.total;
        let placedTotal=orderPlaced.length;
        let orderDeliveredLength=deliveredOrder.length;

       
    

        var data = {
           start: start,
           end: end,
           totalOrders: orderTotalLength,
           shippedOrders: orderShippedLength,
           placedOrders:placedTotal,
           faildOrders: orderFailLength,
           totalSales: total,
           cod: codLength,
           paypal: payPalLength,
           razorpay:razorPayLength,
           
           cancelOrder:cancelTotal,
           allUser:totalUsers,
           totalProducts:allProducts,
           deliveredOrder:orderDeliveredLength

       }
   resolve(data)
   })
},

     

    dateReport:(startDate,endDate)=>{
      return new Promise(async(resolve,reject)=>{
          
          
          let end= moment(endDate).format('YYYY-MM-DD')
          let start=moment(startDate).format('YYYY-MM-DD')

          
          let orderSuccess= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:{ $ne: 'failed',$ne:'Cancelled' }}).toArray()
          let orderPending= await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status: 'failed'}).toArray()
          let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
          let cancelOrder=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Cancelled'}).toArray()
          let deliveredOrder=await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gte:start,$lte:end},status:'Delivered'}).toArray()
          let allUser=await db.get().collection(collection.USER_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
          let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({date:{$gte:start,$lte:end}}).toArray()
          let razorPay=await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"RazorPay"}).toArray()
          let payPal=await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"PayPal"}).toArray()
          let cod =await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"COD"}).toArray()
          let totalAmount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $group:{
                  _id:null,
                  total:{$sum:"$totalAmount"}
                }
              }
            ]).toArray()
            
           
            let payPalLength=payPal.length;
            let razorPayLength=razorPay.length;
            let codLength=cod.length;
          let allProducts=products.length;
          let totalUsers=allUser.length;
          let cancelTotal=cancelOrder.length
          let orderSuccessLength = orderSuccess.length
          let orderTotalLength = orderTotal.length
          let orderFailLength = orderPending.length;
          let total=totalAmount[0]?.total
          let orderDeliveredLength=deliveredOrder.length;
         
          var data = {
             start: start,
             end: end,
             totalOrders: orderTotalLength,
             successOrders: orderSuccessLength,
             faildOrders: orderFailLength,
             totalSales:total,
             cod: codLength,
             paypal: payPalLength,
             razorpay: razorPayLength,
             currentOrders: orderSuccess,
             cancelOrder:cancelTotal,
             allUser:totalUsers,
             totalProducts:allProducts,
             deliveredOrder:orderDeliveredLength
         }
     resolve(data)
    
     })

   },
   addCateoffer:(cateOffer)=>{
       return new Promise(async(resolve,reject)=>{
           cateOffer.startDate=moment( cateOffer.startDate).format('YYYY-MM-DD')
           cateOffer.endDate=moment(cateOffer.endDate).format('YYYY-MM-DD')
          let exist=await db.get().collection(collection.CATEGORY_OFFERS).findOne({Name:cateOffer.Name})
         if(exist){
             resolve()
         }else{
             db.get().collection(collection.CATEGORY_OFFERS).insertOne(cateOffer).then((response)=>{
                 resolve(response)
             }).catch((err)=>{
                 reject(err)
             })
         }
       })
   },
   getAllCategoryOffer:()=>{
       return new Promise(async (resolve,reject)=>{
           let categoryOffer=await db.get().collection(collection.CATEGORY_OFFERS).find().sort({$natural:-1}).toArray()
           resolve(categoryOffer)
       })
   },
   startCategoryOffer:(todayDate)=>{
       let cateStartDate=moment(todayDate).format('YYYY-MM-DD') 
       return new Promise(async(resolve,reject)=>{
           let data=await db.get().collection(collection.CATEGORY_OFFERS).find({startDate:{$lt:cateStartDate}}).toArray();
           if(data.length>0){
               await data.map(async(oneData)=>{
                  let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:oneData.Name,offer:{$exists:false}}).toArray();
                   await products.map((data)=>{
                       let actualPrice=data.Price
                       let newP=(((data.Price)*(oneData.offerPercent))/100);
                       let newPrice=actualPrice-newP;
                       newPrice=newPrice.toFixed()

                       db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(data._id)},{
                           $set:{
                               actualPrice:actualPrice,
                               Price:newPrice,
                               offer:true,
                               offerPer:oneData.offerPercent
                           }
                       })

                   })
               })
               resolve()
           }else{
               resolve()
           }
       })
   },
   deleteCateOffer:(Id)=>{
       return  new  Promise(async(resolve,reject)=>{
           let categoryOffer=await db.get().collection(collection.CATEGORY_OFFERS).findOne({_id:objectId(Id)})
           let cateName=categoryOffer.Name
           let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:cateName},{offer:{$exists:true}}).toArray();
           if(products){
               db.get().collection(collection.CATEGORY_OFFERS).deleteOne({_id:objectId(Id)}).then(async()=>{
                   await products.map((product)=>{
                       db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(product._id)},{
                         $set:{
                             Price:product.actualPrice
                         },
                         $unset:{
                             actualPrice:"",
                             offer:"",
                             offerPer:""
                              

                         }  
                       }).then((response)=>{
                          resolve(response)
                       }).catch((err)=>{
                           reject(err)
                       })
                   })
               })
           }

       })
   },
   addCouppon:(data)=>{
       return new Promise((resolve,reject)=>{
           let startDate=moment(data.startDate).format('YYYY-MM-DD')
           let endDate=moment(data.endDate).format('YYYY-MM-DD')

           let dataObj={
               couponCode:data.couponCode,
               startDate:startDate,
               endDate:endDate,
               offerPercent:parseInt(data.offerPercent),
               User:[]
           }
           db.get().collection(collection.COUPON_COLLECTION).insertOne(dataObj).then(()=>{
               resolve()
           }).catch((err)=>{
               resolve(err)
           })
       })
   },
   deleteCoupon:(Id)=>{
       return new Promise((resolve,reject)=>{
           db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(Id)}).then((response)=>{
               resolve(response)
           })
       })
   },
   getAllCoupon:()=>{
       return new Promise(async(resolve,reject)=>{
        let coupons=await db.get().collection(collection.COUPON_COLLECTION).find().sort({$natural:-1}).toArray()
        resolve(coupons)
       })
   },
   startCouponOffers:(date)=>{
    let couponStartDate = moment(date).format('YYYY-MM-DD')
    return new Promise(async(resolve,reject)=>{
        let data= await db.get().collection(collection.COUPON_COLLECTION).find({$and:[{startDate:{$lte:couponStartDate}},{endDate:{$gte:couponStartDate}}]}).toArray()
        
        if(data.length >0){
            await data.map((onedata)=>{
                db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:objectId(onedata._id)},{
                  $set:{
                    available: true
                  }
                }).then(()=>{
                    resolve()
                })
            })
        }else{
            resolve()   
        }
    })
   },
   handleWishlist:(wishlist,products)=>{
    return new Promise((resolve,reject)=>{
        if(wishlist?.products){
            wishlist=wishlist.products.map((product)=>product.item.toString());
            products.forEach((product)=>{
                if(wishlist.includes(product._id.toString())){
                    product.wish=true
                }
            })
        }
        resolve(products)
    })
   },

}