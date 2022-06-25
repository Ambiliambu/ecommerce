function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
         if(response.status)
         {
            let count=$('#cart-count').html()
            count=parseInt(count)+1
            $("#cart-count").html(count)
         }
    
        }
    })
}



function removeCartProducts(itemId){
    $.ajax({
        url:'/remove-cartproducts/'+itemId,
        method:'post',
        success:(response)=>{
             // alert(response) 
             location.reload();
             
        }
    })
}

// function removeCartProducts(itemId){
//     $.ajax({
//         url:'/remove-cartproducts/'+itemId,
//         method:'post',
//         success:(response)=>{
//              // alert(response) 
//         }
//     })
// }




// function changeQuantity(cartId,proId,userId,count){
//     let quantity=parseInt(document.getElementById(proId).innerHTML)
//    count=parseInt(count)
 
//    $.ajax({
//        url:'/change-product-quantity',
//        data:{
          
//            cart:cartId,
//            product:proId,
//             user:userId,
//            count:count,
//            quantity:quantity

          
//        },
//        method:'post',
//        success:(response)=>{
//            if(response.removeProduct){
//                location.reload()

//            }else{
//                document.getElementById(proId).innerHTML=quantity+count
//                document.getElementById('total').innerHTML=response.total
//                  // location.reload()
//            }
//        }
//    })
// }