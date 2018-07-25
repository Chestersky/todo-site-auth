const bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    mongoose = require("mongoose"),
    express = require("express"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    Todo = require("./models/todo"),
    app = express();
//config
mongoose.connect("mongodb://localhost:27017/todo_app_auth",{ useNewUrlParser: true });
app.set("view engine","ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(express.static(__dirname + "/public"));
app.use(require("express-session")({
    secret: "this is my first todo app with authenticate",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
    res.locals.loggedUser = req.user;
    next();
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//index route
app.get("/", function(req, res) {
    if(req.isAuthenticated()){
        res.redirect("/todos");
    }else{
        res.redirect("/login");   
    }
});

app.get("/todos", isLoggedIn, function(req, res){
    User.findOne({username: req.user.username}).populate("todos").exec(function(err,user){
        if(err){
            console.log(err);
        }else{
            res.render("index",{todos: user.todos});
        }
    });
});

//new route
app.get("/todos/new", isLoggedIn, function(req,res){
    res.render("new");
});

//create route
app.post("/todos", isLoggedIn, function(req, res){
    req.body.todo.body = req.sanitize(req.body.todo.body);
    Todo.create(req.body.todo, function(err, newTodo){
        if(err){
            console.log("error")
        }else{
            User.findOne({username: req.user.username},function(err,foundUser){
                if(err){
                    console.log("error");
                }else{
                    foundUser.todos.push(newTodo._id);
                    foundUser.save(function(err,data){
                        if(err){
                            console.log(err);
                        }else{
                            res.redirect("/todos");
                        }
                    });
                }
            });
        }
    });
});

//show route
app.get("/todos/:id", isLoggedIn, function(req,res){
    Todo.findById(req.params.id, function(err, foundTodo){
        if(err){
            res.redirect("/todos");
        }else{
            res.render("show", {todo: foundTodo})
        }
    });
});

//edit route
app.get("/todos/:id/edit", isLoggedIn, function(req, res) {
    Todo.findById(req.params.id, function(err, foundTodo){
        if(err){
            res.redirect("/todos");
        }else{
            res.render("edit", {todo: foundTodo});
        }
    });
});

//update route
app.put("/todos/:id", isLoggedIn, function(req,res){
    req.body.todo.body = req.sanitize(req.body.todo.body);
    Todo.findByIdAndUpdate(req.params.id, req.body.todo, function(err,updatedTodo){
        if(err){
            res.redirect("/todos");
        }else{
            res.redirect("/todos/" + req.params.id);
        }
    });
});

//delete route
app.delete("/todos/:id", isLoggedIn, function(req,res){
    Todo.findByIdAndRemove(req.params.id, function(err,removed){
        if(err){
            res.redirect("/todos");
        }else{
            User.findOneAndUpdate({username: req.user.username},{$pull:{todos: req.params.id}}).populate("todos").exec(function(err,user){
                if(err){
                    console.log(err);
                }else{
                    res.redirect("/todos");
                }
            });
        }
    });
})

//register form
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req,res){
    User.register(new User({username: req.body.username}),req.body.password, function(err,user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/todos");
        });
    });
});

//login form
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {successRedirect: "/todos", failureRedirect:"/login"}), function(req, res) {
});

//logout

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

//account info
app.get("/account/:id", isLoggedIn, function(req, res) {
    User.findById(req.params.id,function(err, foundUser) {
        if(err){
            console.log(err);
        }else{
            res.render("account", { user: foundUser});      
        };
    })
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/");
}

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("fine");
});