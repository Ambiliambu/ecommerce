var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')

let moment=require('moment');
const async = require('hbs/lib/async');

let Credential = {
  email: "admin123@gmail.com",
  password: "123456"
}

const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/admin-login')
  }
}


/* GET admin listing. */

router.get('/', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    res.render('admin/view-dashboard', { admin: true })
  }
  else {
    res.render('admin/admin-login', { "loginErr": req.session.adminLogginerr, adminlogin: true })
  }
  req.session.adminLoginerr = false

});


/* admin-login*/

router.get('/admin-login', (req, res) => {
  res.render("admin/admin-login", { adminlogin: true });
})

/* dashboard*/

router.get('/view-dashboard', verifyAdmin, function (req, res, next) {
  productHelpers.monthlyReport().then((data)=>{
  res.render('admin/view-dashboard', { admin: true, adminlogin: true ,data});
     
  })
});




router.post('/admin-login', function (req, res) {
  if (req.body.Email == Credential.email && req.body.Password == Credential.password) {
    req.session.adminLoggedIn = true
    res.redirect('/admin/view-dashboard')
  } else {
    req.session.adminLogginerr = "Invalid Admin Emailaddress or password"
    res.redirect('/admin/')
  }
})


/*admin-logout*/

router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin/admin-login')
})



/*product-management*/



router.get('/view-products', verifyAdmin, (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, adminlogin: true, products })

  })

});

/* add-product*/

router.get('/add-product', verifyAdmin, (req, res) => {
  productHelpers.getAllCategories().then((categories)=>{
  res.render('admin/add-product', { admin: true, adminlogin: true ,categories});
     
  })
})
router.post('/add-product', (req, res) => {
 
  productHelpers.addProduct(req.body, (id) => {
     // 1
     if (req.files?.image1) {
      let image1 = req.files.image1;
      image1.mv("./public/product-images/" + id + ".jpg")

    }
    // 2
    if (req.files?.image2) {
      let image2 = req.files.image2;
      image2.mv("./public/product-images/" + id + "a.jpg")

    }
    // 3
    if (req.files?.image3) {
      let image3 = req.files.image3;
      image3.mv("./public/product-images/" + id + "b.jpg")

    }
    // 4
    if (req.files?.image4) {
      let image4 = req.files.image4;
      image4.mv("./public/product-images/" + id + "c.jpg")
     
    }
    res.redirect("/admin/view-products");


  })

})







/* delete-product*/

router.get('/delete-product', verifyAdmin, (req, res) => {
  let proId = req.query.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/view-products')
  })
})



/*edit-product*/
     
router.get('/edit-product', verifyAdmin, async (req, res) => {
  let product = await productHelpers.getProductDetails(req.query.id)
  res.render('admin/edit-product', { admin: true, adminlogin: true, product })
})



router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    

     // 1
     if (req.files?.image1) {
      let image = req.files.image1;
      image.mv("./public/product-images/" + id + ".jpg")
    }
    // 2
    if (req.files?.image2) { 
      let image2 = req.files.image2;
      image2.mv("./public/product-images/" + id + "a.jpg")
    }
    // 3
    if (req.files?.image3) {
      let image3 = req.files.image3;
      image3.mv("./public/product-images/" + id + "b.jpg")
    }
    // 4
    if (req.files?.image4) {
      let image4 = req.files.image4;
      image4.mv("./public/product-images/" + id + "c.jpg")
    }
    res.redirect('/admin/view-products')
  })
})


/*user-management*/


router.get('/view-users', verifyAdmin, (req, res) => {
  productHelpers.getAllUsers().then((users) => {
    res.render('admin/view-users', { admin: true, users, adminlogin: true })

  })

});


/*block-user*/

router.get('/block-user', verifyAdmin, (req, res) => {
  let userId = req.query.id

  productHelpers.updateUserblock(userId).then((response) => {
    res.redirect('/admin/view-users')
  })
})

/*unblock-user*/

router.get('/unblock-user', verifyAdmin, (req, res) => {
  let userId = req.query.id
  productHelpers.updateUserunblock(userId).then((response) => {
    res.redirect('/admin/view-users')
  })
})


/*category-management*/


router.get('/view-categories', verifyAdmin, (req, res) => {
  productHelpers.getAllCategories().then((categories) => {
    res.render('admin/view-categories', { admin: true, adminlogin: true, categories })

  })

});

/*add-categories*/

router.get('/add-category', verifyAdmin, (req, res) => {
  res.render('admin/add-category', { admin: true, adminlogin: true });
})


router.post('/add-category', (req, res) => {
  
  productHelpers.addCategory(req.body, (id) => {
  if(req.files?.image){
    let image = req.files.image
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-category', { admin: true })

      } else {
      }

    })
  }

  })

})


/*delete-category*/

router.get('/delete-category', verifyAdmin, (req, res) => {
  let categoryId = req.query.id
  productHelpers.deleteCategory(categoryId).then((response) => {
    res.redirect('/admin/view-categories')
  })
})


/* order-management*/



router.get('/view-orders',verifyAdmin,(req, res) => {
  productHelpers.getAllOrders().then((orders) => {
    
    res.render('admin/view-orders', { admin: true, adminlogin: true, orders })
  })

})


router.get('/view-orderss/:id',verifyAdmin,async(req,res)=>{

  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-orderss',{admin: true, adminlogin: true,products})


})



/* change-orders-status*/


router.get('/change-status',verifyAdmin,(req,res)=>{
  let orderId=req.query.id;
  let newStatus=req.query.status
  let delivaryStatus=false;
  let cancelStatus=false;
  if(newStatus=='Delivered'){
    cancelStatus=false;
    delivaryStatus=true;

  }
  if(newStatus=='Cancelled'){
    cancelStatus=true;
  }
  productHelpers.updateStatus(orderId,newStatus,cancelStatus,delivaryStatus).then((response)=>{
     res.redirect('/admin/view-orders')
  })
})



/* product offer management*/


router.get('/view-productOffer',verifyAdmin,(req,res)=>{
   productHelpers.getAllProductOffer().then((productOffer)=>{
    res.render('admin/view-productOffer',{admin:true, adminlogin: true,productOffer})

   })
})

/* add-productOffer*/

router.get('/add-proOffer',verifyAdmin,(req,res)=>{
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/add-proOffer',{admin: true, adminlogin: true,products})

  })
})

router.post('/add-proOffer',(req,res)=>{
  productHelpers.addproOffer(req.body).then((response)=>{
      if(response.exist){
        req.session.proOfferExist=true;
        res.redirect('/admin/view-productOffer')
      } else{
        res.redirect('/admin/view-productOffer')
      }
  })

})


/*delete-productoffer*/


router.get('/delete-proOffer',verifyAdmin,(req,res)=>{
     let id=req.query.id;
     productHelpers.deleteProductOffer(id).then((response)=>{
       res.redirect('/admin/view-productOffer')
     })
})



/*reports*/

router.post('/date-report',(req,res)=>{
  let startDate=req.body.startDate;
  let endDate=req.body.endDate;


  productHelpers.dateReport(startDate,endDate).then((data)=>{
    productHelpers.getAllOrder(startDate,endDate).then ((orders)=>{ 
   
    res.render('admin/sales-report',{admini:true,adminlogin:true,data,orders})
    })
  })
})



router.get('/limit-report',verifyAdmin,(req,res)=>{
  let today=new Date();
  let endDate= moment(today).format('YYYY-MM-DD')
  let startDate=moment(endDate).subtract(30,'days').format('YYYY-MM-DD')
  if(req.query.limit=='yearly'){
    startDate=moment(endDate).subtract(364,'days').format('YYYY-MM-DD')
  }else if(req.query.limit=='monthly'){
    startDate=moment(endDate).subtract(30,'days').format('YYYY-MM-DD')
  }else if(req.query.limit=='weekly'){
    startDate=moment(endDate).subtract(7,'days').format('YYYY-MM-DD')
  }
  productHelpers.dateReport(startDate,endDate).then((data)=>{
    productHelpers.getAllOrder(startDate,endDate).then((orders)=>{ 
    res.render('admin/sales-report',{admin:true,adminlogin:true,data,orders})
  })
})

})

router.get('/sales-report',verifyAdmin ,(req,res)=>{
   productHelpers.monthlyReport().then((data)=>{
   productHelpers.getAllOrders().then((orders)=>{
    
   
  
    productHelpers.getOrderProduct().then((order)=>{

    res.render('admin/sales-report',{admin: true, adminlogin: true, data,orders,order})
       
    })

   
   })

  })
  })



/*category  Offer*/

  router.get('/view-categoryOffer',verifyAdmin,(req,res)=>{
    productHelpers.getAllCategoryOffer().then((categoryOffer)=>{
    res.render('admin/view-categoryOffer',{admin:true,categoryOffer})
      
    })
  })

/*add-cateOffer*/

  router.get('/add-cateOffer',verifyAdmin,(req,res)=>{
    productHelpers.getAllCategories().then((categories)=>{
      res.render('admin/add-cateOffer',{admin:true,adminlogin:true,categories})
    
  })
})
router.post('/add-cateOffer',verifyAdmin,(req,res)=>{
  productHelpers.addCateoffer(req.body).then((response)=>{
    res.redirect('/admin/view-categoryOffer')


  })
})

/*delete-cateOffer*/


router.get('/delete-cateOffer',verifyAdmin,(req,res)=>{
  let id=req.query.id;
  productHelpers.deleteCateOffer(id).then((response)=>{
    res.redirect('/admin/view-categoryOffer')
  })
})



/*coupon*/


router.get('/view-coupon',verifyAdmin ,(req,res)=>{
  productHelpers.getAllCoupon().then((coupons)=>{
    res.render('admin/view-coupon',{admin:true,adminlogin:true,coupons})
  })
})

/*add-coupon*/

router.get('/add-coupon',verifyAdmin,(req,res)=>{
  res.render('admin/add-coupon',{admin:true,adminlogin:true})
})

router.post('/add-coupon',(req,res)=>{
   productHelpers.addCouppon(req.body).then(()=>{
     res.redirect('/admin/view-coupon')
   })
})


/*delete-coupon*/

router.get('/delete-coupon',verifyAdmin,(req,res)=>{
  let id=req.query.id;
  productHelpers.deleteCoupon(id).then((response)=>{
    res.redirect('/admin/view-coupon')
  })
})





module.exports = router;
