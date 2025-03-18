const express = require('express')
const app = express()
const port = 3000

app.set("view engine", "ejs");

app.get('/', (req, res) => {
  res.send('TEST')
})

app.get("/dashboard", (req,res) => {
    res.render("dashboard")
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
