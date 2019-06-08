const port = 3000
const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express()
app.use(bodyParser.json());
app.use(cors())


mongoose.connect('mongodb://localhost:27017/dotInfotech', { useNewUrlParser: true }).then(d => console.log("DB connected")).catch(e => console.log("error db connection"))

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    meal: String,
    resturant: String,
    dishes: [{
        dish: String,
        serving: Number
    }],
    personCount: Number
});
const Order = mongoose.model('Order', OrderSchema)

Order.find({},(error,data)=>{
    console.log(JSON.stringify(data,null,2));
})

app.post('/', (req, res) =>{
    Order.create(req.body.data).then(order=>{
        return res.status(200).json({"message":"success"})
    }).catch(e=>{
        return res.status(500)
    })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))