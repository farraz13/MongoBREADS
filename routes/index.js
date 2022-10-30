var express = require("express");
var router = express.Router();
var moment = require("moment");
var { ObjectId } = require('mongodb');

/* GET home page. */
module.exports = function (db) {
  router.get("/", async function (req, res) {
    try {
      const url = req.url == "/" ? "/?page=1&sortBy=string&sortMode=asc" : req.url;
      const page = req.query.page || 1;
      const limit = 3;
      const offset = (page - 1) * limit;
      const wheres = {};
      const filter = `&idCheck=${req.query.idCheck}&id=${req.query.id}&stringCheck=${req.query.stringCheck}&string=${req.query.string}&integerCheck=${req.query.integerCheck}&integer=${req.query.integer}&floatCheck=${req.query.floatCheck}&float=${req.query.float}&dateCheck=${req.query.dateCheck}&startDate=${req.query.startDate}&endDate=${req.query.endDate}&booleanCheck=${req.query.booleanCheck}&boolean=${req.query.boolean}`;
      const sortMongo = {}
      let sortBy = req.query.sortBy || "string"
      let sortMode = req.query.sortMode || "asc"

      sortMongo[sortBy] = sortMode == "asc" ? 1 : -1;


      if (req.query.string && req.query.stringCheck == "on") {
        wheres["strings"] = new RegExp(`${req.query.string}`, "i");
      }

      if (req.query.integer && req.query.integerCheck == "on") {
        wheres["integers"] = parseInt(req.query.integer);
      }

      if (req.query.float && req.query.floatCheck == "on") {
        wheres["floats"] = JSON.parse(req.query.float);
      }

      if (req.query.dateCheck == "on") {
        if (req.query.startDate != "" && req.query.endDate != "") {
          wheres["dates"] = {
            $gte: new Date(`${req.query.startDate}`),
            $lte: new Date(`${req.query.endDate}`),
          };
        } else if (req.query.startDate) {
          wheres["dates"] = { $gte: new Date(`${req.query.startDate}`) };
        } else if (req.query.endDate) {
          wheres["dates"] = { $lte: new Date(`${req.query.endDate}`) };
        }
      }

      if (req.query.boolean && req.query.booleanCheck == "on") {
        wheres["booleans"] = JSON.parse(req.query.boolean);
      }

      const result = await db.collection("farraz")
        .find(wheres)
        .toArray()
      var total = result.length;
      const pages = Math.ceil(total / limit);
      const data = await db.collection("farraz")
        .find(wheres)
        .skip(offset)
        .limit(limit)
        .sort(sortMongo)
        .toArray()
      res.render("index", {
        data,
        pages,
        page,
        filter,
        query: req.query,
        sortBy,
        sortMode,
        moment,
        url,
      });
    } catch (err) {
      res.send(err)
    }
  })

  router.get("/add", (req, res) => {
    res.render("add");
  });

  router.post("/add", async (req, res) => {
    try {
      var myobj = {
        strings: `${req.body.string}`,
        integers: parseInt(req.body.integer),
        floats: parseFloat(req.body.float),
        dates: new Date(`${req.body.date}`),
        booleans: JSON.parse(req.body.boolean),
      };
      const data = await db.collection("farraz").insertOne(myobj);
      res.redirect('/');
    } catch (err) {
      res.send(err);
    }
  });

  router.delete("/delete/:id", async (req, res) => {
    try {
      const data = await db
        .collection('farraz')
        .deleteOne({ '_id': ObjectId(`${req.params.id}`) });
      console.log(data)
      res.redirect('/');
    } catch (err) {
      console.log(err)
      res.send(err);
    }
  });

  router.get("/edit/:id", async (req, res) => {
    try {
      const data = await db
        .collection("farraz")
        .findOne({ '_id': ObjectId(`${req.params.id}`) });
      res.render("edit", { item: data, moment });
    } catch (err) {
      res.send(err);
    }
  });

  router.post("/edit/:id", async (req, res) => {
    try {
      var myobj = {
        strings: req.body.string,
        integers: parseInt(req.body.integer),
        floats: parseFloat(req.body.float),
        dates: req.body.date,
        booleans: JSON.parse(req.body.boolean),
      };

      const update = await db.collection("farraz").updateOne(
        { "_id": ObjectId(`${req.params.id}`) },
        { $set: myobj }
      )
      res.redirect('/');
    } catch (err) {
      res.send(err);
    }
  });

  return router;
};