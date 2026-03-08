require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

require('./routes/vitals')(app);
require('./routes/notify')(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Bystander backend on http://localhost:${PORT}`));
