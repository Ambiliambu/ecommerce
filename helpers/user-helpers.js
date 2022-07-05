var db =require('../config/connection') 
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
// const { reject } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const { status, get } = require('express/lib/response')
const { response } = require('../app')
const { ObjectId } = require('mongodb')
const { PRODUCT_COLLECTION } = require('../config/collections')
const { reject, promise } = require('bcrypt/promises')
var objectId=require('mongodb').ObjectId
let moment=require('moment')
const Razorpay= require('razorpay')
const { localeData } = require('moment')
const { order } = require('paypal-rest-sdk')
var instance = new Razorpay({
    key_id: 'rzp_test_JW0ArFR8X9svKN',
    key_secret: 'HFpHyxvtUgoLUOCEJ1qq93mo',
  });



module.exports={
    doSignup:(userData)=>{
        return new Promise(async (resolve,reject)=>{


            if (userData.wallet) {
                let mainUser=await db.get().collection(collection.USER_COLLECTION).findOne({_id:userData.referedBy})
                if(mainUser.wallet<200){
                  await db.get().collection(collection.USER_COLLECTION).updateOne({ _id:userData.referedBy }, { $inc: { wallet: 50 } });
                }
              }
              userData.wallet = userData.wallet ? userData.wallet : 0;
     
      userData.Password=await bcrypt.hash(userData.Password,10)
          user={
              Name:userData.Name,
              Mobile:`+91${userData.Mobile}`,
              Status:true,
              Email:userData.Email,
              Password:userData.Password,
              date: moment(new Date()).format("YYYY-MM-DD"),
              refer:userData.refer,
              referedBy:userData.referedBy,
             wallet:userData.wallet


          }

            db.get().collection(collection.USER_COLLECTION).insertOne(user).then((data)=>{
                resolve(data);

            })
              
        })
        
    },


    findExist: (Data) => {
        return new Promise(async (resolve, reject) => {
          db.get()
            .collection(collection.USER_COLLECTION)
            .findOne({
              $or: [{ Email: Data.Email }, { Mobile: Data.Mobile}],
            })
            .then((status) => {
              resolve(status);
            });
        });
      },











    doLogin:(userData)=>{
         return new Promise(async(resolve,reject)=>{
             let loginStatus=false
             let response={}
             let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
             if(user){
                 bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                       resolve({status:false})
                    }
                 })

             }else{
                 resolve({status:false})
             }

         })
    }, 
     getUsedetails:(No)=>{
             return new Promise(async(resolve,reject)=>{
                 let user=await db.get().collection(collection.USER_COLLECTION).findOne({Mobile:No})
                 resolve(user)
         })
        },
        getusedUserdetails:(no)=>{
            return new Promise(async(resolve,reject)=>{
                let user=await db.get().collection(collection.USER_COLLECTION).findOne({Mobile:no})
                resolve(user)
        })
        },
        addToCart:(proId,userId)=>{
            let proObj={
                item:objectId(proId),
                quantity:1
            }
            return new Promise(async (resolve,reject)=>{
                let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                if(userCart){
                    let proExist=userCart.products.findIndex(product=>product.item==proId)
                    if(proExist!=-1){
                        db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }).then(()=>{
                            resolve()
                        })
                    }else{
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                       $push:{products:proObj}


                   }).then((response)=>{
                       resolve()
                   })
                   
                    }
                }else{
                    let cartObj={
                        user:ObjectId(userId),
                        products:[proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                        resolve()
                    })
                }
            })
        },


        




        deleteCartProduct:(data)=>{
              return new Promise((resolve,reject)=>{
                  db.get().collection(collection.CART_COLLECTION)
                  .updateOne({_id:objectId(data.cart)},
                  {$pull:{products:{item:objectId(data.product)}}
                }).then((response)=>{
                      resolve({removeProduct:true})
                  })
              })  
       
        },
        





        
        getCartProducts:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:"$products"
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                         }
                    },{
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                             foreignField:'_id',
                             as:'product'
                        }
                    },{
                        $project:{
                            item:1,quantity:1,product:{ $arrayElemAt:["$product",0]}
                        }
                    }
                    
                ]).toArray()  
                resolve( cartItems)
               cartItems.forEach((element)=>{
                element.eachPro=element.quantity * element.product.Price;
               })
            })
        },




        getCartCount:(userId)=>{
            return new Promise(async (resolve,reject)=>{
                let count=0;
                let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
                if(cart){
                    count=cart.products.length
                }
                resolve(count)
            })
        },
      







        changeProductQuantity:(details)=>{
            details.count=parseInt(details.count)
            details.quantity=parseInt(details.quantity)

             
            return new Promise((resolve,reject)=>{
                if(details.count==-1 && details.quantity==1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart)},
                    {
                        $pull:{products:{item: objectId(details.product)}}
                    }).then((response)=>{
                        resolve({removeProduct:true})
                    })  

                }else{
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }).then((response)=>{
                        resolve({status:true})
                    })
                }
               
            })
        },












        getTotalAmount:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:"$products"
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                         }
                    },{
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                             foreignField:'_id',
                             as:'product'
                        }
                    },{
                        $project:{
                            item:1,quantity:1,product:{ $arrayElemAt:["$product",0]}
                        }
                    },{
                        $group:{
                            _id:null,
                            // total:{$sum:{$multiply:['$quantity','$product.Price']}}
                            total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.Price'}]}}
                        }
                    }
                    
                ]).toArray()  
              

                resolve(total[0]?.total)
               
            })
        },
        placeOrder:(order,products,total,totalPrice,coupon,couponDiscount,wallet,walletDiscount)=>{
            return new Promise((resolve,reject)=>{
               

              var date=new Date()
              var dates=moment(date).format('YYYY-MM-DD');


                let status=order['payment-method']==='COD'?'Placed':'Failed'

                let cStatus=false;
                let noOffer=false;
                 let wStatus=false;
                let CandW=false;
                if(wallet&&coupon){
                    CandW=true
               }else{

                if(coupon){
                    cStatus=true
             
                 }
                 if(wallet){
                    wStatus=true;
                 }
                 if(!coupon && !wallet){
                     noOffer=true;

                 }
                
             }
                let orderObj={
                    deliveryDetails:{
                        name:order.name1,
                        houseName:order.HouseName1,
                        streetLocation:order.StreetLocation1,
                        state:order.State1,
                        pin:order.Pin1,
                        emailAddress:order.EmailAddress1,
                        phone:order.Phone1

                    },
                    userId:objectId(order.userId),
                    paymentMethod:order['payment-method'],
                    products:products,
                    totalAmount:total,
                    oldTotal:totalPrice,
                    status:status,
                    date: dates,


                    cancel:false,
                    delivery:false,
                    
                    couponStatus:cStatus,
                    couponDiscount:couponDiscount,
                    noOffer:noOffer,
                    walletStatus:wStatus,
                    walletDiscount:walletDiscount,
                    CandW:CandW

               




                }

                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                     db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                    resolve(response.insertedId)
                })
            })

        },
        getCartProductList:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                resolve(cart?.products)
            })
        },
        getUserOrders:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let orders=await db.get().collection(collection.ORDER_COLLECTION)
                .find({userId:objectId(userId)}).sort({$natural:-1}).toArray()
                
                orders.forEach((element)=>{
                    if(element.status=='Failed'){
                        element.failed=true
                    }else{
                        element.failed=false

                    }
                })

                resolve(orders)
            })
        },
        getOrderProducts:(orderId)=>{
            return new Promise(async(resolve,reject)=>{
                let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{_id:objectId(orderId)}
                    },
                    {
                        $unwind:"$products"
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                         }
                    },{
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                             foreignField:'_id',
                             as:'product'
                        }
                    },{
                        $project:{
                            item:1,quantity:1,product:{ $arrayElemAt:["$product",0]}
                        }
                    }
                    
                ]).toArray()  
                resolve(orderItems)
               
            })
        },
        cancelOrders:(orderId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:"Cancelled",
                    cancel:true,
                }
            }).then((response)=>{
                resolve(response)
            })
            })
          
        },
      
         getUserDetails:(userId)=>{
            return new Promise(async(resolve,reject)=>{
             db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((userDetails)=>{
                resolve(userDetails)
             })
                   
        
               
            })
            
        },
     
        updateProfile:(userId,userData)=>{
            // b userData.Mobile=parseInt(userData.Mobile)
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:objectId(userId)},{
                    $set:{
                        Name:userData.Name,
                        Email:userData.Email,
                      //  Mobile:`+91${userData.Mobile}`,
                        Mobile:userData.Mobile,
                        

                    }
                }).then((response)=>{
                    resolve(response)
                })
            })
        },
        
        addUserAddress:(userId,data)=>{
            return new Promise(async(resolve,reject)=>{
             let user=await  db.get().collection(collection.USER_COLLECTION)
                .findOne({_id:objectId(userId)})

                if(user){
                    data._id=objectId()
                    if(user.address){
                        db.get().collection(collection.USER_COLLECTION)
                        .updateOne({_id:objectId(userId)},
                        {
                          $push:{address:data}
                        }
                       
                        ).then((response)=>{
                            resolve(response)
                        }).catch((err)=>{
                            resolve(err)
                        })

                    }else{
                        let add=[data];
                        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                        {
                            $set:{
                                address:add
                            }

                        }
                        ).then((response)=>{
                            resolve(response);
                        }).catch((err)=>{
                            resolve(err)
                        })

                    }
                
                }
            });

           
        },
        getUserAddress:(userId)=>{
            return new Promise(async(resolve,reject)=>{
               let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)});
                   resolve(user)
            })
        },
        deleteAddress:(userId,data)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:objectId(userId)},
                {
                      $pull:{address:{_id:objectId(data.addId)}}
                }
                ).then((response)=>{
                    resolve(response);
                })
            })
        },
            passwordMatch: (oldPassword, userId) => {
                return new Promise(async (resolve, reject) => {
                  let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId)});
                  if (user) {
                    bcrypt.compare(oldPassword, user.Password).then((response) => {
                      resolve(response);
                    });
                  }
                }); 
         },
         updatePassword: (newPassword, userId) => {
            return new Promise(async (resolve, reject) => {
              newPassword = await bcrypt.hash(newPassword, 10);
              db.get().collection(collection.USER_COLLECTION).updateOne({_id: ObjectId(userId)},
                  {
                    $set: {
                      Password: newPassword,
                    },
                  }
                )
                .then((response) => {
                  resolve(response);
                });
            });
          },
        
          generateRazorpay:(orderId,total)=>{            
              return new Promise((resolve,reject)=>{
                var options = {
                    amount: total*100, // amount in the smallest currency unit
                    currency: "INR",
                    receipt: ""+orderId
                  };
                    instance.orders.create(options, function(err, order) {
                      if(err){
                      }else{
                        resolve(order)
                      }
                   
                  });
              })
          },
          verifyPayment:(details)=>{
              return new Promise((resolve,reject)=>{
                  const crypto=require('crypto');
                  let hmac = crypto.createHmac('sha256', 'HFpHyxvtUgoLUOCEJ1qq93mo');
                  hmac.update(details['payment[razorpay_order_id]'] + '|'+ details['payment[razorpay_payment_id]']);
                  hmac=hmac.digest('hex');
                  if(hmac==details['payment[razorpay_signature]']){
                      resolve()
                  }else{
                      reject()
                  }


              })
          },
          changePaymentStatus:(orderId)=>{
              return new Promise((resolve,reject)=>{
                  db.get().collection(collection.ORDER_COLLECTION)
                  .updateOne({_id:objectId(orderId)},
                  {
                      $set:{
                          status:'Placed'
                      }
                  }
                  ).then(()=>{
                      resolve()
                  }).catch((err)=>{
                      resolve(err);
                  }) 
              })
          },
          getProductCategory:(category)=>{
              return new Promise(async(resolve,reject)=>{
                  let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:category}).toArray()
                  resolve(products)
              })
          },
          couponValidate:(data,userId)=>{
              return new Promise(async(resolve,reject)=>{
                  obj={}
                  let date=new Date()
                  date=moment(date).format('YYYY-MM-DD')
                  let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({couponCode:data.couponCode})

                  if(coupon){
                      let couponId=coupon._id;
                      let users = coupon.User
                      let userChecker = users.includes(userId)
                      if(userChecker){
                          obj.couponUsed=true;
                          resolve(obj)
                      }else{
                          if(date<=coupon.endDate){
                            let total = parseInt(data.total)
                            let percentage = parseInt(coupon.offerPercent)
                            let discountVal = ((total * percentage) / 100).toFixed()
                            obj.total = total - discountVal
                            obj.oldTotal=total
                            obj.success = true
                            obj.couponId=couponId
                            resolve(obj) 
                          }else{
                            obj.couponExpired = true;
                            resolve(obj)
                          }
                      }
                  }else{
                    obj.invalidCoupon = true
                    resolve(obj)

                  }
              })
          },
          couponAddressAdd:(userId,Id)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:objectId(Id)},
                    {
                    $push:{User:userId}
                    }).then((result)=>{
                    resolve(result)
                    })
              })
          },
          userFind: (userId) => {
            return new Promise(async(resolve, reject) => {
              let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });
              resolve(user);
            });
          },
          checkReferal: (referal) => {
            return new Promise(async (resolve, reject) => {
              let refer = await db.get().collection(collection.USER_COLLECTION).find({ refer: referal }).toArray();
              if(refer){
                  resolve(refer)
              }else{
                  resolve(err)
              }
            });
          },
          findUserWallet:(userId)=>{
            return new Promise(async(resolve,reject)=>{
              let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
              resolve(user)
            })
          },
          applyWallet:(user,details)=>{
            return new Promise((resolve,reject)=>{
              let obj={}
              if(details.applyAmount>user.wallet){
                obj.noBalance=true
                resolve(obj)
              }else{
               
                obj.success=true;
                resolve(obj)
              }
            })
          },
          walletChange:(userId,amount)=>{
            return new Promise((resolve,reject)=>{
              db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                {
                  $inc:{wallet:-amount}
                }).then((response)=>{
                  obj.success=true
                  resolve(obj)
                }).catch((err)=>{
                  resolve(err)
                })
            })
          },
          removeOrder: (details) => {
    
            return new Promise((resolve, reject) => {
              
              db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne(
                  { _id: ObjectId(details.order) },
                  {
                    $set: {
                      status: "Cancelled",
                      cancel: true,
                    },
                  }
                )
                .then((response) => {
                  resolve(response);
                });
            });
          },
           addedToWallet:(userId,amount)=>{
            return new Promise((resolve,reject)=>{
              Amount=parseInt(amount)
              db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
              {
                $inc:{wallet:Amount}
              }).then((response)=>{
                resolve(response)
              }).catch((err)=>{
                resolve(err)
              })
            })
          },





          //wishlist


          addToWish:(proId,userId)=>{
            let proObj={
                item:objectId(proId),
                quantity:1
            }
            return new Promise(async (resolve,reject)=>{
                let userWish=await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userId)})
                if(userWish){
                    let proExist=userWish.products.findIndex(product=>product.item==proId)
                    if(proExist!=-1){
                        db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({user:objectId(userId)},
                        {
                            $pull:{products:{item:objectId(proId)}}
                        }).then(()=>{
                            resolve()
                        })
                    }else{
                    db.get().collection(collection.WISHLIST_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                       $push:{products:proObj}


                   }).then((response)=>{
                       resolve(response)
                   })
                   
                    }
                }else{
                    let wishObj={
                        user:ObjectId(userId),
                        products:[proObj]
                    }
                    db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response)=>{
                        resolve(response)
                    })
                }
            })
        },
        removeWishh:(proId,userId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne(
                    {user:objectId(userId)},
                    {$pull:{products:{item:objectId(proId)}}}
                )
                .then(()=>{
                    resolve(response)
                })
            })
        },
        getWishProducts:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let wishItems=await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:"$products"
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                         }
                    },{
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                             foreignField:'_id',
                             as:'product'
                        }
                    },{
                        $project:{
                            item:1,quantity:1,product:{ $arrayElemAt:["$product",0]}
                        }
                    }
                    
                ]).toArray()  
                resolve( wishItems)
               
            })
        },
        getWishCount:(userId)=>{
            return new Promise(async (resolve,reject)=>{
                let count=0;
                let wish=await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:ObjectId(userId)})
                if(wish){
                    count=wish.products.length
                }
                resolve(count)
            })
        },
        getWish:(userId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userId)}).then((output)=>{
                    resolve(output)
                })
            })
        },
        removeWish:(proId,userId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne(
                    {user:objectId(userId)},
                    {$pull:{products:{item:objectId(proId)}}}
                ).then((response)=>{                 
                    resolve({removeProduct:true})
                })
            })
        }
        ,
       



      
}    


