# eCommerce-buddy
Tracks prices of products from Amazon, Sams Club, Target, and Walmart.

**About**
- This project started as a way for me to track desirable holiday items during holiday season 2022. I am now doing a public release for others to use. 

**How to Use**
1. Navigate to the folder in terminal, type "node tracker.js" to start
2. Enter the product link for the item you would like to monitor
3. Enter the time you would like to wait before sending another GET request


**REQUIREMENTS** 
- The config.json will need to be configured before use
    - For *repeatWebhook* either choose **on** or **off**, if on is chosen, webhook will send 3 times over 90 seconds before returning to monitoring
    - For *webhook* input the discord webhook url  
    - For *useProxy* either choose **yes** or **no**, if yes is chosen, a host:port:user:pass proxy to send the request instead of localhost

**NOTE**
- If you plan to have a shorter delay, it is recommended to use proxies. You may need to experiment with the delay between GET requests to prevent temporary blocks from the website.
