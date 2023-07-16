const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;
// to serve up static files like css and images, we need to use the static method of express

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// whenever any browser accesses the route endpont " / ", with the get request , we send them the signup.html file which contains a form

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/signup.html", () => {
    console.log("bruh");
  });
});

app.post("/", async (request, response) => {
  // the form data is sent back to our server

  let firstName = request.body.first;
  let lastName = request.body.last;
  let email = request.body.email;

  console.log(firstName, lastName, email);

  if (!firstName || !lastName || !email) {
    response.sendFile(__dirname + "/failure.html");
  } else {
    // now we have to send this form data using proper formatting to the mailchimp api and wait for their status code, if we receive a status code of ok, it means that the person was successfully added to the mailing list
    try {
      const apikey = process.env.API_KEY;
      const audienceID = process.env.AUDIENCE_ID;
      const url = `https://us17.api.mailchimp.com/3.0/lists/${audienceID}`;

      // we have to send the data to the mailchimp servers in the proper json format

      const data = {
        members: [
          {
            email_address: email,
            status: "subscribed",
            merge_fields: {
              FNAME: firstName,
              LNAME: lastName,
            },
          },
        ],
      };

      const dataJSON = JSON.stringify(data);

      console.log(dataJSON);

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apikey}`,
      };

      
      const mailchimpresponse = await axios.post(url, dataJSON, { headers });

      // console.log(mailchimpresponse)
      
      if (mailchimpresponse.status === 200) {
        if (mailchimpresponse.data.error_count > 0) {
          const error = mailchimpresponse.data.errors[0];
          if (error.error_code === 'ERROR_CONTACT_EXISTS') {
            // User already exists
            response.sendFile(__dirname + "/already-subscribed.html");
          } else {
            // Other error occurred
            response.status(500).send('An error occurred');
          }
        } else {
          // Successfully subscribed
          response.sendFile(__dirname + "/success.html");
        }
      } else {
        response.status(mailchimpresponse.status).sendFile(__dirname + "/failure.html");
      }
    } catch (error) {
      response.status(500).send('An error occurred');
    }

    // if not then they were not successfully added to the mailing list
    // we then send back this status code along with some other code or text as the response to this post request
  }
});

app.post("/failure", (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log("Server is up and running on port 3000");
});
