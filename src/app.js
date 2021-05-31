const app = require("express")();
const http = require("http").createServer(app);

var cors = require("cors");
const io = require("socket.io")(http, {
    cors: {
        origins: ["https://message-angular.herokuapp.com"],
    },
});

const documents = {};
app.use(cors({ origin: "*" }));
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,content-type"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
});
io.on("connection", (socket) => {
    let previousId;
    const safeJoin = (currentId) => {
        socket.leave(previousId);
        socket.join(currentId, () =>
            console.log(`Socket ${socket.id} joined room ${currentId}`)
        );
        previousId = currentId;
    };

    socket.on("getDoc", (docId) => {
        safeJoin(docId);
        socket.emit("document", documents[docId]);
    });

    socket.on("addDoc", (doc) => {
        documents[doc.id] = doc;
        safeJoin(doc.id);
        io.emit("documents", Object.keys(documents));
        socket.emit("document", doc);
    });

    socket.on("editDoc", (doc) => {
        documents[doc.id] = doc;
        socket.to(doc.id).emit("document", doc);
    });

    io.emit("documents", Object.keys(documents));

    console.log(`Socket ${socket.id} has connected`);
});

http.listen(4444, () => {
    console.log("Listening on port 4444");
});
