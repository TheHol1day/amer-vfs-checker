require('dotenv').config();
const { writeFileSync, readFileSync } = require('fs');
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const nodeFetch = require('node-fetch');


const WIDTH = 1300;
const HEIGHT = 800;

const houses = [];
const { CHAT_ID, BOT_API } = process.env;


const runTask = async () => {
    // await runPuppeteer("https://visa.vfsglobal.com/are/en/nld/login");
    await runPuppeteer("https://visa.vfsglobal.com/are/en/nld/login");
};

const runPuppeteer = async (url) => {
    let conf = new Object();

    let vpn = ["https://uk1785.nordvpn.com:89", 
    "https://fr822.nordvpn.com:89", 
    "https://be163.nordvpn.com:89",
    "https://de1052.nordvpn.com:89",
    "https://es153.nordvpn.com:89",
    "https://nl820.nordvpn.com:89"];
    let chosenserver = rand(vpn);
    console.log("chosen server: "+chosenserver);
    // VPN
    conf.vpnUser   = conf.vpnUSer   || 'AFpn44fbK1haLmTdNQ4ScUPU';
    conf.vpnPass   = conf.vpnPass   || 'zZkBjbQjXAsKpLiLH6LEqU9W';
    conf.vpnServer = conf.vpnServer || chosenserver;

    console.log('opening headless browser');
    const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${WIDTH},${HEIGHT}`,
            '--disable-dev-shm-usage',
            '--proxy-server='+conf.vpnServer],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        },
    });

    const page = await browser.newPage();
    // https://stackoverflow.com/a/51732046/4307769 https://stackoverflow.com/a/68780400/4307769
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36');

    await page.authenticate({
        username: conf.vpnUser,
        password: conf.vpnPass,
      });

    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log("Reached login page");
    await page.type('#mat-input-0', "amereid92@gmail.com", { delay: 100 });
    await page.type('#mat-input-1', "Kiss@939", { delay: 100 });
    const signInButtons = await page.$x('/html/body/app-root/div/app-login/section/div/div/mat-card/form/button')
    await signInButtons[0].click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Reached new booking page");
    const bookButtons = await page.$x('/html/body/app-root/div/app-dashboard/section[1]/div/div[2]/button')
    await sleep(5000);
    await bookButtons[0].click()

    // application center
    await sleep(3000);
    console.log("Reached new appointment page");
    var chooseCenters = await page.waitForXPath('/html/body/app-root/div/app-eligibility-criteria/section/form/mat-card[1]/form/div[1]/mat-form-field');
    await chooseCenters.click();

    var abuDhabi = await page.$x('//*[@id="mat-option-0"]');
    await abuDhabi[0].click();
    console.log("Selected centre");

    await sleep(3000);
    var chooseCategory = await page.waitForXPath('/html/body/app-root/div/app-eligibility-criteria/section/form/mat-card[1]/form/div[3]/mat-form-field');
    await chooseCategory.click();

    var subCategoryShortStay = await page.$x('//*[@id="mat-option-4"]');
    await subCategoryShortStay[0].click();
    console.log("Selected visa sub category");

    await sleep(5000);

    var result = await page.waitForXPath('/html/body/app-root/div/app-eligibility-criteria/section/form/mat-card[1]/form/div[4]/div');
    let value = await page.evaluate(el => el.textContent, result)
    console.log(value);
    if (value != "No appointment slots are currently available. Please try another application centre if applicable") {
        nodeFetch(`https://api.telegram.org/bot${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value,
                chat_id : CHAT_ID,
                parse_mode : 'markdown',
            }),
        });
    }
    
// /html/body/app-root/div/app-eligibility-criteria/section/form/mat-card[1]/form/div[4]/div
// Earliest Available Slot : Oct 13, 2022

    console.log('closing browser');
    await browser.close();
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function rand(items) {
    // "|" for a kinda "int div"
    return items[items.length * Math.random() | 0];
}


if (CHAT_ID && BOT_API) {
    runTask();
} else {
    console.log('Missing Telegram API keys!');
}
