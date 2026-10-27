const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// static files
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/', (req, res) => res.render('index'));

app.listen(PORT, () => {
  console.log(`✅ سرور روی پورت ${PORT} → http://localhost:${PORT}`);
});
