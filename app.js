const express = require("express"),
bodyParser = require("body-parser"),
mongoose = require("mongoose"),
dotenv = require("dotenv"),
ejs = require("ejs"),
_ = require("lodash"),
app = express();
dotenv.config();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {
  
  Item.find({}, (err, foundItems) => {
    
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});


  //Route parameters
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}, (err, foundList) => {
    if (!err){
      if (!foundList){
        
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});


app.post("/", (req, res) => {
  
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });
  
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});


app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if (!err){
                res.redirect("/" + listName);
            }
        });
    }
});


app.get("/about", (req, res) => {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
    console.log("Server has started successfully");
});