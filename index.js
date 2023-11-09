const Express = require('express');
const cors = require('cors');
const app = Express();

const usersRoute = require('./routes/users');

const PORT = 8000;



app.use(cors());
app.use(Express.json());

app.listen(PORT, () => {
    console.log(`Serving on port : ${PORT}`);
});

app.use('/api', usersRoute);

