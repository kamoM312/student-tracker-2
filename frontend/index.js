 import express from 'express';
 import bodyParser from 'body-parser';
 import axios from 'axios';

 const app = express();
 const port = 4000;

 let login_id;
 let isLogged = false;

 app.use(express.static('public'));

 app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.render("login.ejs");
});

app.get("/user/:id", async (req, res) => {
  if(!isLogged){
    res.redirect("/");
  }
  const user_id = req.params.id;
  try {
    const response = await axios.get(`http://localhost:3000/users/${user_id}`);
    const result = response.data;
    result.forEach(e => {
      e.date = e.date_of_birth.substring(0, 10);
      e.user_id = user_id;
    });
    res.render("index.ejs", { data: result });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
});

app.post("/getUser", async (req, res) => {
   if(!isLogged){
    res.redirect("/");
  }
    const id = req.body.id;
    console.log("id"+id);
    console.log("login"+login_id)
  try {
    const response = await axios.get(`http://localhost:3000/user/${id}/${login_id}`);
    const result = response.data;
    result[0].date = result[0].date_of_birth.substring(0, 10); 
    console.log(result);
    // if(result.length < 1){

    //   res.render("index.ejs", {noResult: "No match found"})
    // }
    res.render("index.ejs", { data: result });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
});

app.get("/addForm", (req, res) => {
  if(!isLogged){
    res.redirect("/");
  }
  res.render("addForm.ejs");
})

app.get(`/editForm/:id/:name/:email`, (req, res) => {
  if(!isLogged){
    res.redirect("/");
  }
  const id = req.params.id;
  const name = req.params.name;
  const email = req.params.email;
  res.render("editForm.ejs", {id, name, email});
})

app.get("/register", (req, res) => {
  res.render("register.ejs");
}) 


app.post("/add", async (req, res) => {
   if(!isLogged){
    res.redirect("/");
  } else {
  // const {name, email} = req.body;
  const { name, email, phone, dob } = req.body;
  const data = {
    name: name,
    email: email,
    phone: phone,
    date_of_birth: dob,
  }

  console.log("data: " + data);

  try {
    await axios.post(`http://localhost:3000/create/${login_id}`, { data });
    res.redirect(`/user/${login_id}`);
  } catch (error) {
    console.error("Failed to create user:", error.message);
    res.redirect(`/user/${login_id}`);
  }}
});

app.post("/login", async (req, res) => {
  if(isLogged){
    res.redirect(`/user/${login_id}`);
  }
  const { email, password } = req.body;
  const data = {
    email: email,
    password: password,
  }

  // console.log("data "+data.email);

  try {
    const results = await axios.post("http://localhost:3000/login", { data });
    // console.log(results)
    // console.log(results.data)
    login_id = results.data;
    isLogged = true;
    res.redirect(`/user/${results.data}`);
  } catch (error) {
    console.error("Failed to login:", error.message);
    res.redirect("/");
  }
})

app.post("/edit", async (req, res) => {
  if(!isLogged){
    res.redirect("/");
  }

  const { id, name, email, phone, dob } = req.body;
  const data = {
    id: id,
    name: name,
    email: email,
    phone: phone,
    date_of_birth: dob,
  }

  try {
    await axios.post(`http://localhost:3000/update/${login_id}`, { data });
    res.redirect(`/user/${login_id}`);
  } catch (error) {
    console.error("Failed to update user:", error.message);
    res.redirect(`/user/${login_id}`);
  }
});

app.post("/register", async (req, res) => {
  const {full_name, email, password, retypePassword} = req.body;
  const data = {
    full_name: full_name,
    email: email,
    password: password,
    retypePassword: retypePassword,
  }

  console.log(data);

  try {
    await axios.post(`http://localhost:3000/register`, { data });
    res.redirect("/");
  } catch (error) {
    console.log("Failed to register new user: ", error.message);
    res.redirect("/register");
  }
})

app.post(`/delete/:id`, async (req, res) => {
  if(!isLogged){
    res.redirect("/");
  }
  const id = req.params.id;
  console.log(id)
  const itemId = {
    id: id
  }
  
  try {
    await axios.post(`http://localhost:3000/delete/${login_id}`, itemId);
    res.redirect(`/user/${login_id}`);
  } catch (error) {
    console.error("Failed to update user:", error.message);
    res.redirect(`/user/${login_id}`);
  }
})



 app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

