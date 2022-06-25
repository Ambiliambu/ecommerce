var express = require('express');
require("dotenv").config();
const res = require('express/lib/response');
const { redirect, status } = require('express/lib/response');
const async = require('hbs/lib/async');
var router = express.Router();
const productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')
const createReferal = require('referral-code-generator');







const serviceSID=process.env.SERVICESID
const accountnSID=process.env.ACCOUNTNSID
const authToken=process.env.AUTHTOKEN
const client =require('twilio')(accountnSID,authToken)



const paypal = require('paypal-rest-sdk');
const { startProductOffer } = require('../helpers/product-helpers');
const { validateExpressRequest } = require('twilio');
 
paypal.configure({
  mode: 'sandbox', 
  client_id: process.env.CLIENTID,
  client_secret:process.env.CLIENTSECRET
});


 





const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()

  }else{
    res.redirect('/login') 
  }
  
}

/* GET home page. */

router.get('/', async function(req, res, next) {
  let today=new Date();
 
   
  let user = req.session.user
 
  let userEn=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }


  productHelpers.getAllCategories().then((categories)=>{
  productHelpers.getAllProducts().then(async(products)=>{
    productHelpers.startCategoryOffer(today)
    productHelpers.startProductOffer(today)
    productHelpers.startCouponOffers(today);
  

    let wishCount=await userHelpers.getWishCount(req.session.user?._id);
    
    let output=await userHelpers.getWish(req.session.user?._id)
    let filteredProduct=await productHelpers.handleWishlist(output,products)
   
     products=filteredProduct;

    

    let coupon = await productHelpers.getAllCoupon();
    let couponCod = coupon[0];

    res.render('user/view-products',{products,user:true,userEn,cartCount,categories,couponCod,wishCount})

  })
})
});

/*user-login*/

router.get('/login',(req,res)=>{
   if(req.session.userLoggedIn){
    res.redirect('/')
   }else{
     res.render('user/login',
     {"loginErr":req.session.userLoginErr,user:true,"blockErr":req.session.blockErr})
   
     req.session.userLoginErr=false;
     req.session.blockErr=false;
   }
})



router.get('/login-otp',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/');

  }
  else{
    res.render('user/login-otp',{user:true,"blockErr":req.session.blockErr,"noNumberErr":req.session.noNumberErr,})
   
   req.session.blockErr=false;
   req.session.noNumberErr=false;
   
  }

})
router.post('/login-otp',(req,res)=>{
  let No = req.body.Mobile;
  let no =`+91${No}`;
userHelpers.getUsedetails(no).then((user)=>{
  if (user){
    if(user.Status == true){
    
      client.verify
     .services(serviceSID)
     .verifications.create({
       to: no,
       channel:"sms"
      
     })
     
      .then((resp)=>{      
        req.session.number=resp.to
       res.redirect('/login/otp')
     });
    }
    else{
      req.session.blockErr='This Account has been blocked'
     
      res.redirect('/login-otp')
      req.session.blockErr=false

    }
  }else{
    req.session.noNumberErr="Mobile Number Not exist";
    

    res.redirect('/login-otp')
    req.session.noNumberErr=false;
  }
})

})

router.get('/login/otp',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/');
  }else{
    res.render('user/otp',{"otpErr":req.session.otpErr,user:true,otp:true})
    
    req.session.otpErr=false;
  }

  
  
})
router.post('/login/otp',(req,res)=>{
    const otp  = req.body.Otp
    number=req.session.number
    client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: number,
      code: otp

    })
    .then((resp)=>{
      let no=resp.to
     if(resp.valid){
      userHelpers.getusedUserdetails(no).then((user)=>{
        req.session.userLoggedIn=true
        req.session.user=user   


        res.redirect('/' );

      })
      
    
      }else{
        req.session.otpErr="Invalid OTP"
        res.redirect('/login/otp')
      }
    })
})
 

router.get('/signup',async(req,res)=>{

  let refer = (await req.query.refer) ? req.query.refer : null;
  
  res.render('user/signup',{user:true,"emlMobErr":req.session.emlMobErr,refer})
  req.session.emlMobErr=false;
})





router.post('/signup',(req,res)=>{

  let refer = createReferal.alphaNumeric("uppercase", 2, 3);
  req.body.refer = refer;
  if (req.body.referedBy != "") {
    userHelpers.checkReferal(req.body.referedBy).then((data) => {
        req.body.referedBy = data[0]._id;
        
       req.body.wallet = 100;

        userHelpers.doSignup(req.body).then((response) => {
          res.redirect('/');
        });
      })
      .catch(() => {
        req.session.referErr = "Sorry No such Code Exists";
        res.redirect('/signup');
      });
  } else {

  userHelpers.findExist(req.body).then((status)=>{
    if(status){
      req.session.emlMobErr="Email or Mobilenumber already exist";
      res.redirect('/signup')
    }else{
      userHelpers.doSignup(req.body).then((response)=>{
        res.redirect('/login')
      })
    }
  
  })
}

  
   
})





router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      if(response.user.Status){
        req.session.userLoggedIn=true
      req.session.user=response.user;
      res.redirect('/')
      }else{
        req.session.blockErr="This account has been blocked"
        res.redirect('/login')
      }

     
      
    }else{
      req.session.userLoginErr="Invalid Email or Password"

      res.redirect('/login')
    }
  })

})

/*user-logout*/

router.get('/logout',(req,res)=>{
  req.session.userLoggedIn = false;

  req.session.user=null
  res.redirect('/')
})

/*category*/

router.get('/view-category',verifyLogin,async(req,res)=>{

   let category=req.query.Category;
   let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  userHelpers.getProductCategory(category).then(async(products)=>{
    let userEn=req.session.user

    let output=await userHelpers.getWish(req.session.user._id)
    let filteredProduct=await productHelpers.handleWishlist(output,products)
    
     products=filteredProduct

    res.render('user/view-category',{user:true,userEn,products,cartCount,wishCount})
  })
  
})




/*cart*/

router.get('/cart',verifyLogin,async(req,res)=>{
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  let products=await userHelpers.getCartProducts(req.session.user._id)
  let userEn = req.session.user
  let userId= req.session.user._id
  let totalValue=0;
  if(products.length>0){
    totalValue=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart',{products,user:true,userEn,userId,totalValue,cartCount,wishCount});

  }else{
    res.render('user/cart-empty',{user:true,userEn})
  }

 
  
})

/*add-to-cart*/  

router.get('/add-to-cart/:id',verifyLogin,async(req,res)=>{

   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    
    res.json({status:true})
   })
})


/*change-pro-qty*/

router.post('/change-product-quantity',(req,res,next)=>{
    userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user) 
      res.json(response)

    })
})


/*remove-cart-pro*/

router.post('/remove-cartproducts',verifyLogin,(req,res)=>{ 
  let userId= req.session.user._id;
  userHelpers.deleteCartProduct(req.body).then((response)=>{
     res.json(response)
   
    
  })

})

/*placeOrder*/

router.get('/place-order',verifyLogin, async (req,res)=>{
    
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  let total=await userHelpers.getTotalAmount(req.session.user._id) 
   let existAddress=await userHelpers.getUserAddress(req.session.user._id);
  let userEn=req.session.user ;
   let User = await userHelpers.findUserWallet(userEn._id);

   wallet = User.wallet;
 
    
    res.render('user/place-order',{user:true,userEn,total,existAddress,cartCount,wallet,wishCount})
 })     







 router.post('/place-order',async(req,res)=>{

   let userEn=req.session.user;

  

   if(req.session?.couponId){
     userHelpers.couponAddressAdd(req.body.userId, req.session.couponId)
   }
   if(req.session?.walletApply) {
    let applyPrice = req.session.walletApply;
    userHelpers.walletChange(userEn._id, applyPrice);
  }



   let products=await userHelpers.getCartProductList(req.body.userId)
   let totalPrice=await userHelpers.getTotalAmount(req.body.userId)

   
   let totalAmount = totalPrice;
   let coupon=false;
   let couponDiscount=0;
  let wallet=false;
  let walletDiscount=0;

  if (req.session?.couponTotal && req.session?.walletAmount) {
    totalAmount = req.session.walletAmount;
    coupon=true
    wallet=true
    walletDiscount=req.session.walletApply;
    couponDiscount= req.session.couponApply;
   

  } else {
    if (req.session?.couponTotal) {
      totalAmount = req.session.couponTotal;
      coupon=true;
      wallet=false;

      
      couponDiscount= req.session.couponApply;
    }
    if (req.session?.walletAmount) {
      totalAmount = req.session.walletAmount;
      wallet=true;
      coupon=false;
      walletDiscount=req.session.walletApply;
    
    }
  }





   userHelpers.placeOrder(req.body, products,totalAmount,totalPrice,coupon,couponDiscount,wallet,walletDiscount).then((orderId)=>{
      req.session.orderId = orderId;

        if(req.body['payment-method']==='COD'){
          res.json({codSuccess:true})

        }else if(req.body['payment-method']==='Razorpay'){
          userHelpers.generateRazorpay(orderId,totalAmount).then((response)=>{
            res.json({...response,razorpaySuccess:true})
          }) 
        }else if(req.body['payment-method']==='Paypal'){

          let value = totalAmount / 74;

          let total = value.toFixed(2);

          let totals = total.toString();

          req.session.total = totals;
  
          const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal"
                },
                redirect_urls: {
                    return_url: "http://localhost:3009/success",
                    cancel_url: "http://localhost:3009/cancel"
                },
                transactions: [{
                    item_list: {
                        items: [{
                            name: "Red Sox Hat",
                            sku: "001",
                            price: totals,
                            currency: "USD",
                            quantity: 1
                        }]
                    },
                    amount: {
                        currency: "USD",
                        total:totals
                    },
                    description: "Hat for the best team ever"
                }]
            };
            
            paypal.payment.create(create_payment_json, function (error, payment) {
              if (error) {
                  throw error;
              } else {
                  for(let i = 0;i < payment.links.length;i++){
                    if(payment.links[i].rel === 'approval_url'){
                      let url = payment.links[i].href;
                      res.json({ url });

                    }else{

                    }
                  }
              }
            });
        }
          
   })
  req.session.couponTotal=null;
  req.session.walletAmount=null;


 })

    

 
 router.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let total = req.session.total;
  let totals = total.toString();

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: totals ,
        },
      },
    ],
  };

  paypal.payment.execute( paymentId,execute_payment_json,function (error, payment) {
      if (error) {
        throw error;
      } else { 

        userHelpers.changePaymentStatus(req.session.orderId).then(() => {
          res.redirect("/order-success");
        });
      }
    }
  );
});

router.get('/cancel', verifyLogin, (req, res) => res.send("Cancelled"));



router.get('/order-success', verifyLogin,(req,res)=>{
   let  userEn=req.session.user;
  res.render('user/order-success',{user:true,userEn})
})


/*user-details*/

router.get('/user-details',verifyLogin,async(req,res)=>{

  let userEn=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  userHelpers.getUserAddress(req.session.user._id).then((userData)=>{
    

    userHelpers.userFind(userEn._id).then((user1) => {
      let refer = user1.refer;
      let wallet = user1.wallet;
      let referalLink = "http://localhost:3009/signup?refer=" + refer;

    res.render('user/user-details',{user:true,userEn,userData,cartCount,referalLink,wallet,wishCount})
      
    });



      
  })
    
  
  })
  



/*edit-user*/


router.get('/edit-user',verifyLogin,async(req,res)=>{
  let userDetails= await userHelpers.getUserDetails(req.query.id) 
  let userEn=req.session.user;
  res.render('user/edit-user',{user:true,userEn,userDetails})

})

router.post('/edit-user/:id',(req,res)=>{
  userHelpers.updateProfile(req.params.id,req.body).then((response)=>{

 
    res.redirect('/user-details')
  })
})


/*add-address*/

router.get('/add-address',verifyLogin,(req,res)=>{
  let userEn=req.session.user;
    res.render('user/add-address',{user:true,userEn})
})

router.post('/add-address',verifyLogin,(req,res)=>{
    let userId=req.session.user._id
    
    userHelpers.addUserAddress(userId,req.body).then((response)=>{
      res.redirect('/add-address')

    })
})

/*delete-address*/

router.post('/delete-address',(req,res)=>{
 userHelpers.deleteAddress(req.session.user._id,req.body).then((response)=>{
  res.json(response)
 })

})

/*edit-password*/

router.get('/edit-password',verifyLogin ,(req,res)=>{
  let passErr = req.session.passwordNotMatch;
  let userEn=req.session.user;
    res.render('user/edit-password',{userEn,user:true,passErr})
    req.session.passwordNotMatch = false;
})


router.post("/edit-password", (req, res) => {
  let userId = req.session.user._id;
  userHelpers.passwordMatch(req.body.OldPassword, userId).then((response) => {
    if (response) {
      userHelpers.updatePassword(req.body.NewPassword, userId).then((response) => {
          req.session.destroy();
          res.redirect("/login");
        }); 
    } else {
      req.session.passwordNotMatch = "Old Password is wrong";
      res.redirect("/edit-password");
    }
  });
});






/*order-list*/

router.get('/order-list',verifyLogin,async(req,res)=>{

  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  let orders=[];
  let userEn=req.session.user;
  orders=await userHelpers.getUserOrders(req.session.user?._id)
  if(orders.status=='failed'){
    orders.failed=true
  }




  if(orders.length>0){
    res.render('user/order-list',{user:true,userEn,orders,cartCount,wishCount})
  }else{
    res.render('user/order-empty',{user:true,userEn,orders})

  }
  
})




router.get('/view-orders/:id',verifyLogin,async(req,res)=>{

  let products=await userHelpers.getOrderProducts(req.params.id)

   let userEn=req.session.user;
  res.render('user/view-orders',{user:true,userEn,products})


})

/*cancel-order*/

router.get('/cancel-orders/:id',verifyLogin,(req,res)=>{
  userHelpers.cancelOrders(req.params.id).then((response)=>{
    res.redirect('/order-list')
  })
   
})



router.post('/verify-payment',(req,res)=>{
  userHelpers.verifyPayment(req.body).then(()=>{

    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{ 
    res.json({status:false,errMsg:'Payment failed'})
  })
})





router.get('/shop',verifyLogin,(req,res)=>{
  let userEn=req.session.user
  res.render('user/shop',{user:true,userEn})
})


/*single-pro*/

router.get('/single-product',verifyLogin,async(req,res)=>{
  let Id=req.query.id ;
  let userEn=req.session.user
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  productHelpers.getAllCategories().then((categories)=>{
    productHelpers.findProduct(Id).then(async(product)=>{
      let cartCount=null
      if(req.session.user){
        cartCount=await userHelpers.getCartCount(req.session.user._id) 
      }

  res.render('user/single-product',{user:true,userEn,categories,product,cartCount,wishCount})

    })
  })

})






/*coupon*/


router.post('/apply-coupon',verifyLogin,(req,res)=>{
  let Id=req.session.user._id;

  userHelpers.couponValidate(req.body,Id).then((response)=>{
    if(response.success){
      req.session.couponApply=response.oldTotal-response.total;
      req.session.couponTotal = response.total;
      req.session.couponId = response.couponId;
      res.json({
        couponSuccess: true,
        total: response.total,
        oldTotal: response.oldTotal,
        
      });
      
    }else if(response.couponUsed){
      res.json({couponUsed: true });
    }else if(response.couponExpired){
      res.json({ couponExpired: true });

    }else{
      res,json({invalidCoupon: true})
    }
  })
})


/*wallet*/

router.post('/apply-wallet',async(req,res)=>{
  let newPrice = req.body.total - req.body.applyAmount;

  req.session.walletAmount = newPrice;
  req.session.walletApply = req.body.applyAmount;
  let userId = req.session.user._id;
  let user = await userHelpers.findUserWallet(userId);
 
  userHelpers.applyWallet(user,req.body).then((response)=>{
    if(response.noBalance){
      res.json({noBalance:true})
    }else if(response.success){
      res.json({success:true})
    }
  })
   
})

router.post("/remove-order", (req, res)=> {
  userHelpers.removeOrder(req.body).then((response) => {
    if (
      req.body.paymentMethod == 'Paypal' ||
      req.body.paymentMethod == 'Razorpay'
    ) {
      if (req.body.status != "failed") {
        let amountToWallet = req.body.totalAmount;
        userHelpers.addedToWallet(req.body.user, amountToWallet).then((result) => {
            res.json({ refund: true });
          });
      } else {
        res.json(response);
      }
    } else {
      res.json(response);
    }
  });
});



/*wishlist*/
router.get('/wishlist',verifyLogin,async(req,res)=>{
  let userEn=req.session.user
  cartCount=null;
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id) 
  }
  
  
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  if(wishCount!=0){
   let product=await userHelpers.getWishProducts(req.session.user._id);

   res.render('user/wishlist',{user:true,userEn,product,cartCount,wishCount})
  }else{
     res.render('user/wishlist-empty',{user:true,userEn})

  }
 })

 /*add-to-wish*/

 router.get('/add-to-wish/:id',verifyLogin,(req,res)=>{

  let userEn=req.session.user;
  userHelpers.addToWish(req.params.id,userEn._id).then(()=>{
    res.json({status:true})
  })
 })

/*remove-wish*/

 router.get('/remove-wishh/:id',verifyLogin,(req,res)=>{
  let userEn=req.session.user;
  userHelpers.removeWishh(req.params.id,userEn._id).then(()=>{
    res.json({status:true})

  })
 })
router.get('/remove-wish/:id',verifyLogin,async(req,res)=>{
  let userEn=req.session.user;
  
  let wishCount=await userHelpers.getWishCount(req.session.user._id);

  if(wishCount!=0){
  userHelpers.removeWish(req.params.id,userEn._id).then((response)=>{
  res.json(response)
  })
  }else{
    req.json()
  }
})


module.exports = router;
