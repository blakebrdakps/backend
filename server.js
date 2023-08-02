const express = require('express');
const { readFileSync }= require('fs');
const app = express();
const bodyParser= require('body-parser');
const { listSubheaderClasses }= require('@mui/material');
const getBestProduct = require("./getBestProduct.js");
const cors = require("cors"); 
const {GoogleAuth} = require("google-auth-library");
let fetch;
import('node-fetch')
  .then(fetchModule => {
    fetch = fetchModule.default;
  })
  .catch(error => {
    console.error('Error importing node-fetch:', error);
  });

const credentials = require("./credentials.json");


const PROJECT_ID =  'product-recmmendations'; 
const MODEL_ID = "text-bison"; 
const CLASSIFIER_MODEL_ID = "6681367124134330368";
  // Function to obtain an access token
const getAccessToken = async () => {
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
};
  //allow back-end to accept only http requests coming from our front-end app...
  app.use(cors({
    origin: "https://master.d29p5aq1tu6bam.amplifyapp.com/"
  }));

  // Parse JSON request bodies
  app.use(bodyParser.json());

  const testEndpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL_ID}:predict`;
  const classifierEndpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/endpoints/${CLASSIFIER_MODEL_ID}:predict`
  // Handle form submission
  app.post('/submit', async (req, res) => {
    const token = await getAccessToken();
    //will be overwritten if first api call goes through successfully! Will be array format: [bestItem, secondBest, thirdBest]
    var products = null; 
      // Extract the form data from the request body
    const formData = req.body;
    //destructure from formData for various things needed to be inserted into AI prompt dynamic string! 
    const {location, price, menuType, extraSpecs} = formData; 
    // Perform actions with the form data
    // Call your AI API models here using the formData object


    //prompt for purpose #1 AI model
    const productRecommend = `You are a marketer for McDonald’s, an American fast food restaurant chain. Suggest a product to feature in a mobile push notification that is directed at people who spend ${price} on average and from ${location}. Focus on items from ${menuType} menu. Additional Specifications: ${extraSpecs} Return just the product name.
    `;
    const classifierBody = {
      "instances": [
        {
            "location" : location,
            "spending_range": price,
            "pref_menu": menuType,
        }
      ]
    }
    //test calling product prompt!
    //important to await so we keep second api call blocked (dependency reasons)
    await fetch(classifierEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(classifierBody)
    }).then(resp => {
      return resp.json()
    }).then(data => {
      console.log(`data: \n`);
      console.log(data)
      const predictions = data["predictions"];
      const prediction = predictions[0];
      const classes = prediction["classes"];
      const scores = prediction["scores"];
      products = getBestProduct(scores, classes); 
    }).catch(err => {
      console.log(`error: ${err}`)
    });

    console.log("first api call done...")
    //array destructure here! 
    const best= products; 
    //prompt for purpose #2 AI model
    const pushPrePrompt = `You are a marketer for McDonald’s, an American fast food restaurant chain. Write a push notification for the McDonald’s app. The notification should have a title no longer than 47 characters, and a body no longer than 100 characters. Decide whether or not to include an offer. Return the output as a json object in string form of the form: {"title":  " title", "body": " body"}. In addition to the regulars menu items, there are combos which include multiple products at a lower price than buying each product separate. If the product you are told to feature is used in a combo, try recommending a combo  with that product to customers. Combo Options Include: BigMac, fries, AND a soft drink; Any lunch or dinner sandwhich, fries, AND a soft drink; Big Breakfast with Hotcakes- Hotcakes (pancakes), egg, sausage, biscuit, AND hashbrowns; Big Breakfast-egg, sausage, biscuit, AND hashbrowns; Breakfast Meal- ANY McGriddles, McMuffin, 2 Sausage Burritos, OR Biscuit AND hashrowns AND coffee.
    input: The notification should be directed to people who spend $15 from Los Angeles. You should promote the product sausage burrito.
    output: {"title":  " Save on your next Sausage Burrito", "body": " Get a Sausage Burrito for $1.00 off when you buy a Sausage Burrito Breakfast Meal"}

    input: The notification should be directed to people who spend $10-20 from Philadelphia. You should promote the product Spicy McChicken.
    output: {"title":  " Philly's Heat: Spicy McChicken", "body": " Add some spice to your meal! Order now for bold flavor."}

    input: The notification should be directed to people who spend $10-20 from Dallas. You should promote the product McFlurry.
    output: {"title":  " Dallas Treat: McFlurry", "body": " Indulge in a McFlurry today! Limited time offer: $1 off your next order."}
    
    input: The notification should be directed to people who spend $10 from Miami. You should promote the McMuffin
    output: {"title":  " McMuffin Meal Deal", "body": " Start your day off right with our delicious McMuffin Meal Deal! Get a McMuffin, hashbrowns, and a drink for only $5."}
    
    input: The notification should be directed to people who spend $10-15 from Detroit. You should promote the product McDouble.
    output: {"title":  "  Seeing Double?", "body": " Get 2 McDoubles for the price of ONE, only in the app"}
    
    input: The notification should be directed to people who spend $5 from Dallas. You should promote the product fries. Extra Context: it is Fourth of July
    output: {"title":  " Stars & Stripes Deal", "body": " You provide the (lone) Star we provide the stripes- FREE fries if you spend $6"}
    
    input: The notification should be directed to people who spend $10-15 from NYC. You should promote the product soft drink.
    output: {"title":  " Ball-Drop Blast!", "body": " Toast in the New Year with a free soft drink with any purchase"}
    
    input: The notification should be directed to people who spend $15 from Madison. You should promote the product Happy Meal. Extra context: it is Halloween
    output: {"title":  " No Tricks Here, Only treats", "body": " Enjoy a free cookie with any Happy Meal"}
    
    input: The notification should be directed to people who spend $5 from New York City. You should promote the product BigMac.
    output: {"title":  " Big Apple Meal Deal", "body": " Get a BigMac Meal with fries and a drink for $5 today"}
    
    input: The notification should be directed to people who spend $15 from New York City. You should promote the product Big Mac.
    output: {"title":  " Big Apple with a Big Mac", "body": " Get a free Big Mac on your next order over $15 from a NYC McDonalds!"}
    
    input: The notification should be directed to people who spend $15 from Chicago. You should promote the product Big Mac.
    output: {"title":  " Get a Big Mac today", "body": " Order now on the McDonald's app and get SECOND FREE to share the iconic taste of the Big Mac! Exclusive offer for the Second City."}
    
    input: The notification should be directed to people who spend $10 from Indianapolis. You should promote the product pancakes
    output: {"title":  " Circle City Hotcakes", "body": " Start your day off right with our delicious pancakes! Get a free cup of coffee with any order of hotcakes."}
    
    input: The notification should be directed to people who spend $15 from New York City. You should promote the product Big Mac. Extra context: is Halloween
    output: {"title":  " Scary Good Deal!", "body": " Get a free Big Mac with your next order when you wear your Halloween costume to a NYC McDonald's!"}`

    const extraSpecsContent = extraSpecs ? `Extra Context: ${extraSpecs}.` : "";
    const bestMainPrompt = `\ninput: The notification should be directed to people who spend ${price} from ${location}. You should promote the product ${best}. ${extraSpecsContent} output: `
    /*
    const secondMainPrompt =  `\ninput: The notification should be directed to people who spend ${price} from ${location}. You should promote the product ${secondBest}. ${extraSpecsContent} output: `
    const thirdMainPrompt =  `\ninput: The notification should be directed to people who spend ${price} from ${location}. You should promote the product ${thirdBest}. ${extraSpecsContent} output: ` 
    */
    const bestPrompt = pushPrePrompt + bestMainPrompt; 
    /*
    const secondPrompt = pushPrePrompt + secondMainPrompt;
    const thirdPrompt = pushPrePrompt + thirdMainPrompt; 
    */
    console.log(`bestPrompt: ${bestPrompt}`)
    const pushReqBody = {
      "instances": [
        {"prompt": bestPrompt}
      ],
      "parameters": {
        "temperature": 1,
        "maxOutputTokens": 256,
        "topK": 40,
        "topP": 0.8,
      },
    };
    var firstPush = null; 
    var titleResp = null;
    var bodyResp = null; 
    await fetch(testEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pushReqBody)
      }).then(resp => {
        return resp.json()
      }).then(data => {
        firstPush = data.predictions[0]["content"];
        console.log("first:", firstPush)
        let cleanedPush = firstPush.trim().replace(/[\n\t]/g, '').replace(/`/g, ''); 
        if (cleanedPush[0] === 'j') {
          cleanedPush = cleanedPush.slice(4)
        }
        console.log("cleaned: ", cleanedPush)
        const mainPush = JSON.parse(cleanedPush);
        titleResp = mainPush["title"];
        bodyResp = mainPush["body"];
      }).catch(err => {
        console.log(`error: ${err}`); 
      }); 
      const msg  = titleResp + "\n" + bodyResp;
      console.log(`msg: ${msg}`); 
    // Return a response
    res.json({ message: msg, location}); 
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

module.exports = app; 