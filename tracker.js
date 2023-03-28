"use strict";
const axios = require('axios-https-proxy-fix');
const prompt = require('prompt-sync')();
const delay = require('delay');
const date = require('date-and-time');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const fs = require('fs');
let Info = JSON.parse(fs.readFileSync('./config.json'));
let userHook = new Webhook(Info.webhook);
let repeatHook = Info.repeatWebhook;
let proxyStatus = Info.useProxy
let currentSite = ""; // Setting global scope so it can be accessed outside of function

async function main() // Main function
{    
    console.log("");
    console.log("\x1b[31m    ███████╗ ██████╗ ██████╗ ███╗   ███╗███╗   ███╗███████╗██████╗  ██████╗███████╗    \x1b[0m██████╗ ██╗   ██╗██████╗ ██████╗ ██╗   ██╗");
    console.log("\x1b[31m    ██╔════╝██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔════╝██╔══██╗██╔════╝██╔════╝    \x1b[0m██╔══██╗██║   ██║██╔══██╗██╔══██╗╚██╗ ██╔╝");
    console.log("\x1b[31m    █████╗  ██║     ██║   ██║██╔████╔██║██╔████╔██║█████╗  ██████╔╝██║     █████╗      \x1b[0m██████╔╝██║   ██║██║  ██║██║  ██║ ╚████╔╝ ");
    console.log("\x1b[31m    ██╔══╝  ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██╔══██╗██║     ██╔══╝      \x1b[0m██╔══██╗██║   ██║██║  ██║██║  ██║  ╚██╔╝  ");
    console.log("\x1b[31m    ███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║  ██║╚██████╗███████╗    \x1b[0m██████╔╝╚██████╔╝██████╔╝██████╔╝   ██║   ");
    console.log("\x1b[31m    ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝    \x1b[0m╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝   ");

    console.log(""); // Spacing between prompts

    let link = prompt("Enter the link you would like to monitor: "); // Prompting user to enter a link

    console.log(""); // Spacing between prompts

    let timeout = prompt("How many minutes do you want before rechecking the price? "); // Prompting user to enter a wait period
    timeout = parseInt(timeout)

    console.log(""); // Spacing between prompts


    let storedPrice = ""; // Initializing store price to empty string

    while (true){ // Runs indefinately

        let currentPrice = "";// Initializing current price to empty string
        let img = ""; // Initializing img to empty string
        let productName = ""; // Initializing title to empty string
        let seller = "";
        
        let dotComRetailer = link.substring(12,link.indexOf('.com'));

        if (dotComRetailer === "amazon"){ //If link is for amazon set current site to amazon
            currentSite = "Amazon";
        }
        else if (dotComRetailer === "samsclub"){ // If link is for sams set current site to sams
            currentSite = "Sam's Club";
        }
        else if (dotComRetailer === "target"){ // If link is for target set current site to target
            currentSite = "Target";
        }
        else if (dotComRetailer === "walmart"){ //If link is for walmart set current site to walmart
            currentSite = "Walmart";
        }


        console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mSending GET request...\x1b[0m`); // Informing the user the GET request 
        appendToFile(`Sending GET request...`); // Log console message


        let html = await getPage(link); // Raw HTML from Axios

        while (!html){ // if get request returns unsuccessful
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mWaiting 5 minutes before retrying...\x1b[0m`); 
            appendToFile(`Waiting 5 minutes before retrying...`); 

            await delay ((5 * 60) * 1000); // 5 minute delay

            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mGetting new proxy...\x1b[0m`); 
            appendToFile(`Getting new proxy...`); 
            await getPage(link); // Calling function to reattempt GET with new proxy
        }


        if (currentSite === "Amazon"){

            currentPrice = html.substring(html.indexOf('a-section aok-hidden twister-plus-buying-options-price-data') + 79, html.indexOf('"priceAmount"') - 2); // Substring that grabs price
            
            productName = html.substring(html.indexOf('TURBO_CHECKOUT_HEADER":"Buy now:') + 33, html.indexOf('"TURBO_LOADING_TEXT"') - 2); // Gets title from HTML

            img = html.substring(html.indexOf('class="imgTagWrapper"') , html.indexOf('data-old-hires') - 1); // Gets image from html
            img = img.split('src="')[1]; 
            img = img.substring(0,img.length - 1);
  

            seller = html.substring(html.indexOf('tabular-attribute-name="Sold by">'), html.indexOf('tabular-buybox-show-more')); //Determines if seller is amazon
            seller = seller.split('tabular-buybox-text-message">')[1];
            seller = seller.split('<')[0];
    
            if (seller !== "Amazon.com"){ // If previous code is not amazon.com, substring and split will be used to get seller name
                seller = html.substring(html.indexOf("id='sellerProfileTriggerId'>") + 28, html.indexOf('tabular-buybox-show-more'));
                seller = seller.split('<')[0];
            }

            if (seller === "Amazon.com"){ // Used to make seller that is passed into webhook uniform with the other sites
                seller = "Amazon"
            }

        }
        if(currentSite === "Sam's Club"){ // Gets correct html for sams

            currentPrice = `$${html.substring(html.indexOf('finalPrice') + 22, html.indexOf('startPrice') - 20)}`; // Substring that grabs price

            while (currentPrice === "$<!doctypehtml><html l"){ // if error occurs in response

                console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[31mError getting price...\x1b[0m`); 
                appendToFile(`Error getting price...`); 

                console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mReattempting in 1 minute...\x1b[0m`); 
                appendToFile(`Reattempting in 1 minute...`); 

                await delay (60 * 1000) // waiting 1 minute

                html = await getPage(link); // reattempting get request, sams sometimes returns incomplete response

                currentPrice = `$${html.substring(html.indexOf('finalPrice') + 22, html.indexOf('startPrice') - 20)}`; // Substring that grabs price
            }
            
            productName = html.substring(html.indexOf("<title>") + 7, html.indexOf("</title>") - 18); // Gets title from HTML

            img = html.substring(html.indexOf('twitter:image') + 24, html.indexOf('twitter:site') - 19); // Gets image from html

            seller = "Sam's Club"; // Only Sams Club sells on their site
        }
        if (currentSite === "Target") { // Gets correct html for target

            currentPrice = `$${html.substring(html.indexOf('current_retail') + 17, html.indexOf('external_system_id') - 3)}`; // Substring that grabs price
        
            productName = html.substring(html.indexOf('sign in to favorite ') + 20, html.indexOf(' to keep tabs on it')); // Gets title from HTML
            
            img = html.substring(html.indexOf('imageSrcSet="https://target.scene7.com') + 13, html.indexOf('300w,') - 46); // Gets image from html
            
            if (html.substring(html.indexOf('Sold and shipped by'), html.indexOf('View partner details')) != ""){ // Shipped and sold by 3rd party
                seller = html.substring(html.indexOf('Sold and shipped by') + 20, html.indexOf('View partner detail') - 2);
            }
            else{ // Sold and shipped by Target
                seller = "Target";
            }
        }
        if (currentSite === "Walmart"){ // Gets correct info from html for walmart

            currentPrice = html.substring(html.indexOf('<span itemprop="price" aria-hidden="false">'), html.indexOf('data-testid="sticky-add-to-cart-price"') ); // Substring that grabs price
            currentPrice = `$${currentPrice.split("$")[1]}`; // Removes HTML before price
            currentPrice = currentPrice.split("<")[0]; // Removes HTML after price

            while (currentPrice.includes('"reviewRating"' ) || currentPrice.length > 10){ // Error Handling for the rare case where current price doesnt return properly
                console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[31mError getting price...\x1b[0m`); 
                appendToFile(`Error getting price...`); 

                console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mReattempting in 1 minute...\x1b[0m`); 
                appendToFile(`Reattempting in 1 minute...`); 

                await delay (60 * 1000) // waiting 1 minute

                html = await getPage(link); // reattempting get request, sams sometimes returns incomplete response

                currentPrice = html.substring(html.indexOf('<span itemprop="price" aria-hidden="false">'), html.indexOf('data-testid="sticky-add-to-cart-price"') ); // Substring that grabs price
                currentPrice = `$${currentPrice.split("$")[1]}`; // Removes HTML before price
                currentPrice = currentPrice.split("<")[0]; // Removes HTML after price

            }
    
            productName = html.substring(html.indexOf("<title>") + 7, html.indexOf("</title>") - 13); // Gets title from HTML
    
            img = html.substring(html.indexOf('1x,') + 4, html.indexOf('2x"') - 49); // Gets image from html
            
            if (html.substring(html.indexOf('Walmart.com') + 28, html.indexOf('seller-ratings-and-reviews') - 43) === "Walmart.com"){ // Shipped and sold by Walmart.com
                seller = "Walmart"
            }
            else if(html.substring(html.indexOf('pageName=item">') + 15, html.indexOf('"b mr1"') - 16) != "Walmart.com") { // Shipped and sold by 3rd party
                seller = html.substring(html.indexOf('pageName=item">') + 15, html.indexOf('"b mr1"') - 16);
            }
            else{ // Sold by 3rd party, shipped by walmart
                seller = html.substring(html.indexOf('<span class="b mr1"> | <!-- -->') + 31, html.indexOf('"nowrap inline-flex items-center v-btm black"') - 19);
            }

            if (seller === "<!DOCTYPE html"){ // fixes weird case where it returns beginning of html
                seller = "Walmart" 
            }
        }
        if (currentPrice !== "" && productName !== "" && seller !== "" && img !== ""){
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[32mSuccessfully captured HTML...\x1b[0m`); 
            appendToFile(`Successfully captured HTML...`); 
        }

        if (storedPrice == ""){ // Initial check when monitor starts
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[32mPrice of ${currentPrice} found, storing price...\x1b[0m`); 
            appendToFile(`Price of ${currentPrice} found, storing price...`); 

            storedPrice = currentPrice; // Setting inital price to current price
            process.title = `${productName} - ${currentPrice}`; // Setting process title
        }
        else if (currentPrice === storedPrice){ // All checks after initial check has been satisfied 
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mPrice of ${currentPrice} already stored...\x1b[0m`); 
            appendToFile(`Price of ${currentPrice} already stored...`); 
        }
         else if (currentPrice !== storedPrice){ // When a price change occurs
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[32mNew price of ${currentPrice} found, storing price...\x1b[0m`); 
            appendToFile(`New price of ${currentPrice} found, storing price...`); 
            
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mSending webhook to Discord...\x1b[0m`); 
            appendToFile(`Sending webhook to Discord...`); 

            if (repeatHook.toLowerCase() == "on"){ // If user has repeat webhook on
                for (let i = 1; i <= 3; i++){
                    await sendWebhook(storedPrice, currentPrice, productName, link,seller, img); // Calling function to send webhook
                    console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[32mWebhook sent!\x1b[0m`); 
                    appendToFile(`Webhook sent!`); 

                    if (i == 3) break;// Break so on the last iteration we dont have to wait another 30 seconds
                    
                    console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mWaiting 30 seconds...\x1b[0m`); 
                    appendToFile(`Waiting 30 seconds...`); 
                    await delay (30 * 1000); // Wait 30 seconds
                }
            }
             else { // If user has repeat webhook off
                await sendWebhook(storedPrice, currentPrice, productName, link, seller, img); // Calling function to send webhook
                console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[32mWebhook sent!\x1b[0m`); 
                appendToFile(`Webhook sent!`); 
            }
            
            storedPrice = currentPrice; // New Stored price is the current price
            process.title = `${productName} - ${currentPrice}`; // Setting process title
        }

        if (timeout == 1){ // If timeout period is 1 min
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mWaiting ${timeout} minute...\x1b[0m`); 
            appendToFile(`Waiting ${timeout} minute...`); 
        } 
        else{ // If timeout period is anything else other than 1 min
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mWaiting ${timeout} minutes...\x1b[0m`); 
            appendToFile(`Waiting ${timeout} minutes...`); 
        }

        await delay((timeout * 60) * 1000); // Converting user defined input into time in minutes
    }

}


async function getPage(url) { // Function that sends get request to designated site passed in

    let userAgent = randomUserAgent(); // Passing a user agent into local variable userAgent to be used in GET request
    let data = "";
    try{
        if (proxyStatus.toLowerCase() === "yes"){ // If user chooses to use proxies

            let proxy = await getProxy(); // Get random proxy

            let proxySplit = proxy.split(":"); // Split proxy into an array

            let response = await axios.get(url, {
            headers: {'User-Agent': `${userAgent}`}, // Custom user agent passed into header
            proxy: {host: proxySplit[0], port: proxySplit[1], auth: { username: proxySplit[2], password: proxySplit[3]}} // Passing parameters for proxy
            }); // Sending request to url w/ custom user agent and proxy
        
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[33mUsing ${proxySplit[0]} as proxy...\x1b[0m`) 
            appendToFile(`Using ${proxySplit[0]} as proxy...`); 

            data = response.data;

            return data; 
        }
        else{
            let response = await axios.get(url, {headers: {'User-Agent': `${userAgent}`}}) // Sending request to url w/ custom user agent, no proxy
            
            data = response.data;

            return data;  
        }
        } catch(err) { 
            console.log(`${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} \x1b[31mUnable to parse HTML, GET error...\x1b[0m`); 
            appendToFile(`Unable to parse HTML, GET error...`); 
            
        }; // If get request results in an error, display an issue and log it
};


async function getProxy() { // Gets random proxy from a list
        const proxyArray = fs.readFileSync('./proxies.txt', 'utf8').split('\r'); // Reading from proxy.txt
        let unformattedproxy = proxyArray[Math.floor(Math.random() * (proxyArray.length - 1))]; // Random proxy from the array
        let proxy = unformattedproxy.replace('\n','') // Removing the newline character
        return proxy.toString(); // Return string representation of the proxy
}


function randomUserAgent() { // Gets a random user agent from an array and returns the user agent
    const uAgentList = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Brave Chrome/84.0.4147.105 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36 OPR/43.0.2442.991',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13.0; rv:106.0) Gecko/20100101 Firefox/106.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.24',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 OPR/92.0.4561.21',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.35',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 OPR/92.0.4561.33',
        'Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 OPR/92.0.4561.33',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 OPR/92.0.4561.33',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 OPR/92.0.4561.33',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42'
    ]; // Random user agent list

    let userAgentInfo = uAgentList[Math.floor(Math.random() * (uAgentList.length - 1))] // Picking a random user agent in the array
    
    return userAgentInfo; // Returning that user agent
}


async function sendWebhook(oldPrice, newPrice, pName, itemUrl, pSeller, pImg) { // Sends webhook to user when price change has occured
    
    let siteColor = ""; // Setting to empty string
    if (currentSite === "Amazon"){ // Gets correct color for walmart
        siteColor = "#FF9900";
    }
    else if (currentSite === "Sam's Club"){ // Gets correct color for sams
        siteColor = "#004b8d";
    }
    else if (currentSite === "Target"){ // Gets correct color for target
        siteColor = "#cc0000";
    }
    else if (currentSite === "Walmart"){ // Gets correct color for walmart
        siteColor = "#007dc6";
    }


    const newHook = new MessageBuilder() // Create new webhook message
    .setAuthor('eCommerce Buddy 🛒') // Setting title
    .setColor(siteColor) // Setting webhook color
    .setDescription(pName) // Set description
    .setThumbnail(pImg) // Setting image to be sent in webhook
    .addField('New Price', newPrice, true) // Setting new price field
    .addField('Old Price', oldPrice, true) // Setting old price field
    .addField('Seller', pSeller, true) // Setting seller 
    .addField('Link', itemUrl, true) // Sends clickable link
    .setFooter('eCommerce Buddy v1.6.0') // Footer
    .setTimestamp(); // Current time
    userHook.send(newHook); // Sends webhook
}


function appendToFile(message) { // Appends to log.txt for verbose logging of monitor
    fs.appendFile('log.txt', String(`[${currentSite}] ${date.format(new Date(), 'MM/DD/YYYY HH:mm:ss')} - ${message}\n`) , (err) =>
    {
        if(err) throw err
    });
}


main(); // Calling main function to execute program