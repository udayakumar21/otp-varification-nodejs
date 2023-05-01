const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { parsePhoneNumber } = require('libphonenumber-js'); // Add this line to import libphonenumber-js
const accountSid = 'ACe31aa8022e67a9986a9334ce929602f1'; // Your Account SID from www.twilio.com/console
const authToken = 'ae8d82a174b28f5da730a66c824bcc53'; // Your Auth Token from www.twilio.com/console

const client = require('twilio')(accountSid, authToken);
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'my-secret-key',
    resave: true,
    saveUninitialized: true
}));

// Render the phone number input form
app.get('/', (req, res) => {
    res.send(`
    <h1>Enter your phone number</h1>
    <form method="post" action="/otp">
      <input type="text" name="phone" placeholder="Phone number">
      <button type="submit">Send OTP</button>
    </form>
  `);
});

// Send OTP to the provided phone number
app.post('/otp', (req, res) => {
    const phoneNumber = req.body.phone;

    try {
        // Parse the phone number and format it in E.164 format
        const parsedNumber = parsePhoneNumber(phoneNumber, 'IN');
        const formattedNumber = parsedNumber.formatInternational();

        const otp = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP

        // Save the OTP in the session
        req.session.otp = otp;

        // Send OTP message to user's phone number
        client.messages.create({
            body: `Your OTP is ${otp}`,
            from: '+16073501494', // Replace with your Twilio phone number
            to: formattedNumber
        }).then(() => {
            res.send(`
        <h1>Enter the OTP sent to your phone</h1>
        <form method="post" action="/validate-otp">
          <input type="text" name="otp" placeholder="OTP">
          <button type="submit">Submit</button>
        </form>
      `);
        }).catch((error) => {
            res.send(`<h1>Error sending OTP: ${error.message}</h1>`);
        });
    } catch (error) {
        res.send(`<h1>Error parsing phone number: ${error.message}</h1>`);
    }
});

// // Validate the OTP entered by the user
// Validate the OTP entered by the user
app.post('/validate-otp', (req, res) => {
    const otp = req.body.otp;

    // Check if OTP session variable exists
    if (req.session.otp) {
        if (otp === req.session.otp.toString()) {
            // OTP verified successfully
            delete req.session.otp; // Remove OTP session variable
            res.send('<h1>OTP verified successfully!</h1>');
            return;
        }
    }

    // Invalid OTP or session expired
    res.send('<h1>Invalid OTP! Please try again.</h1>');
});


// Start the server
http.createServer(app).listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});