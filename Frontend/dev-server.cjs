const express = require('express');
const app = express();

// Serve static files
app.use(express.static('.'));

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});