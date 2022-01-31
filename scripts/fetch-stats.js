import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import moment from 'moment';
import {
    handleCache,
    getText,
    getTags,
    getPartTags,
    mergeTags,
    getCats,
    printTime,
} from './handler/utils.js';
import { fetchChanges } from './handler/api-changes.js';
//import { convertProductDB } from './handler/db-utils.js';
import { includedProducts, ignoreProductsOnUrl, updateProductData } from './handler/interfaces.js';
import globalData from '../data/data.json';
import { products, convertToReduce } from '../data/all-products.reducer.js';
import states from '../data/states.json';

const { parseCategories, parsePartPacks } = globalData;
const params = process.argv;
const bbUrl = 'https://www.bluebrixx.com';
const limit = 'limit=1000';
const today = new Date();
const cacheDir = `./data/cache/`;
// /202105/27/22
const year = today.getFullYear();
const month = ((today.getMonth() + 1) + '').padStart(2, '00');
const day = ((today.getDate()) + '').padStart(2, '00');
const hour = ((today.getHours()) + '').padStart(2, '00');// '01' //
const todayCacheDir = `${cacheDir}${year}${month}/${day}/`;
// self parsed
const parsedDataToday = {
    stats: {},
    items: products,
    changes: {},
    images: {}
};
let allTimeChanges = {};
const productTags = {
    101855: [5],
    101856: [5],
    101858: [5],
    101863: [5],
    103827: [2],
    104119: [2]
}

const isExistingProduct = (itemId) => parsedDataToday.items.some(obj => obj.id === itemId);

const parsePage = async (url) => {
    const parsedData = {
        date: 0,
        all: 0,
        available: 0,
        unavailable: 0,
        "comingsoon!": 0,
        announcement: 0,
    };
    // out of ./data/data.json
    // https://www.bluebrixx.com/de/bluebrixxspecials/military_models
    const urlDirs = url.split('/de/')[1].split('/');
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}${limit}`;

    const cache = await handleCache(
        todayCacheDir,
        `${urlDirs.join('.')}.${hour}`,
        async () => await fetch(fetchUrl).then(res => res.text())
    );
    // TODO: add cheerio
    const dom = new JSDOM(cache);
    // // # trefferListe
    // // 1 - 24 von 113
    // const pager = dom.window.document.querySelector('#trefferListe').textContent;
    const items = Array.from(dom.window.document.querySelectorAll('.category'));
    // .label_announcement -> ANKÜNDIGUNG
    // .label_comingsoon -> BALD ERHÄLTLICH!
    // .label_unavailable -> ZURZEIT VERGRIFFEN
    // .label_parts -> 5337 PCS
    // .searchItemTitle -> Manhattan Unit 3 Foley Square
    // .searchItemDesc -> BlueBrixx-Special
    // .regPrice -> 39,95 EUR
    // img[src] -> https://www.bluebrixx.com/img/items/100/100871/300/100871_1.jpg
    // a[href] -> https://www.bluebrixx.com/de/architecture/100871/Manhattan-Unit-3-Foley-Square-BlueBrixx-Special
    parsedData.date = Math.ceil(new Date().getTime() / 1000);

    //console.log(url, urlDirs, items.length)

    items.map(item => {
        const state = item.querySelector('.label_announcement,.label_comingsoon,.label_unavailable');
        const parts = item.querySelector('.label_parts');
        const price = item.querySelector('.regPrice');
        const title = getText(item.querySelector('.searchItemTitle'));
        const cat = getText(item.querySelector('.searchItemDesc'));
        // https://www.bluebrixx.com/de/architecture/103360/Bockwindmuehle-BlueBrixx-Special
        const href = item.querySelector('a').getAttribute('href').replace(bbUrl, '');
        let id = href.match(/([\d]{6,7})/)[1];
        id = id.startsWith('00') ? id : parseInt(id);

        // skip if wrong categorized
        if (url in ignoreProductsOnUrl && ignoreProductsOnUrl[url].includes(id)
            || (
                !cat.includes('BlueBrixx') && !href.includes('/BPP')
                && !includedProducts.includes(id)
            )) {
            //console.log('wrong bb product', url, cat, id);
            return;
        }

        if (false && id === 600024) {
            console.log('debug 1', url, urlDirs, cat, id)
        }

        let data = {
            title,
            id,
            cats: getCats(url, cat),
            tags: getTags(urlDirs, title, cat, href, id),
            partTags: getPartTags(urlDirs, title, id),
            parts: parts ? parseInt(getText(parts).replace(' PCS')) : 0,
            price: price ? parseFloat(getText(price).replace('*', '').replace(',', '.')) : 0,
            state: state ? states.de.indexOf(getText(state)) : 0,
            history: {},
        };

        if (false && id === 101867) {
            console.log('debug 2', url, data.tags)
        }

        data = updateProductData(data, {
            catName: cat,
        });

        // handle image
        parsedDataToday.images[id] = item.querySelector('img').getAttribute('src').replace(bbUrl, '');
        const image = parsedDataToday.images[id];
        //  "100090": "/img/items/100/100090/300/100090_1.jpg",
        // default is _1
        if (!image.includes('_1')) {
            data.image = parseInt(image.replace(/.*_(\d).*/, '$1'));
        }
        // .png is default
        // see image-extension.json
        if (image.includes('\.jpg')) {
            data.imageExt = 0;
        }

        // add changes from api
        if ((id in allTimeChanges) && Object.keys(allTimeChanges[id].history).length > 0) {
            data.history = allTimeChanges[id].history;
        }

        // push to all
        if (!isExistingProduct(data.id)) {
            parsedDataToday.items.push(data);
            // item exists
        } else {
            let itemIndexExists = -1;
            parsedDataToday.items.filter((obj, i) => {
                const foundTitle = obj.id === data.id;
                if (foundTitle) {
                    itemIndexExists = i;
                }
                return foundTitle;
            })
            // update difference
            if (itemIndexExists > -1) {
                const itemExists = parsedDataToday.items[itemIndexExists];

                // merge tags
                parsedDataToday.items[itemIndexExists].tags = mergeTags(
                    itemExists.tags,
                    data.tags,
                    (productTags[data.id] || []),
                );

                parsedDataToday.items[itemIndexExists].partTags = data.partTags;

                parsedDataToday.items[itemIndexExists].history = { ...itemExists.history, ...data.history };

                // add stage changes if api has no changes for this product
                if (itemExists.state !== data.state) {
                    parsedDataToday.items[itemIndexExists]
                        .state = data.state;
                }
                // remove old cats
                //delete parsedDataToday.items[itemIndexExists].cat;
                //delete parsedDataToday.items[itemIndexExists].cats;
                parsedDataToday.items[itemIndexExists].cats = data.cats;
                // remove old stuff
                parsedDataToday.items[itemIndexExists].title = data.title;
                parsedDataToday.items[itemIndexExists].parts = data.parts;
                parsedDataToday.items[itemIndexExists].price = data.price;

                if (data.image) {
                    parsedDataToday.items[itemIndexExists].image = data.image;
                }
                if (data.imageExt !== undefined) {
                    parsedDataToday.items[itemIndexExists].imageExt = data.imageExt;
                }
            }
        }
    });
}

const parseImageExtension = async (product) => {
    const defaultExt = 'png'
    const image = `${product.id}_1.${defaultExt}`;
    // "/img/items/100/100300/300/100300_2.jpg"
    // //www.bluebrixx.com/img/items/104/104701/150/104701_1.png
    const url = `https://www.bluebrixx.com/img/items/${('' + product.id).substr(0, 3)}/${product.id}/150/${image}`;
    const res = await fetch(url);

    if (res.status === 404) {
        console.log('jpg for', url);
        return 0; // jpg
    }

    // imageExtensions
    return -1; // png
}

const mergeChangesWithDB = async () => {
    await Promise.all( // due fetch for image is that async
        Object.entries(allTimeChanges).map(async (productChange) => {
            const productId = parseInt(productChange[0]);
            const changes = productChange[1];
            let isNewProduct = false;

            let product = parsedDataToday.items.find((product) => product.id === productId);
            // new product
            if (!product) {
                product = {};
                isNewProduct = true;
            }

            product.id = productId;
            product.title = changes.title;
            product.state = changes.state;
            if (changes.parts !== null) {
                product.parts = changes.parts;
            }
            product.price = changes.price;
            // TODO: parse cats for existing products
            //product.cats = changes.cats;
            //product.tags = changes.tags;
            // history
            product.history = {
                ...product.history,
                ...changes.history,
            }

            if (false && product.id === 100090) {
                console.log(product, changes)
            }

            if (isNewProduct) {
                product.cats = changes.cats;
                product.tags = changes.tags;
                // parse correct image extension
                const imageExtension = await parseImageExtension(product);
                if (imageExtension !== -1) {
                    product.imageExt = imageExtension;
                }

                parsedDataToday.items.push(product);
            }
        })
    );
}

(async () => {
    //await convertProductDB(); return;

    let startDate = moment(new Date());
    allTimeChanges = await fetchChanges(false);

    startDate = printTime('fetchChanges', startDate); // 1394ms

    // XTODO1: take all bluebrixx edges an pack into history.file
    // XTODO2: update mergeChangesWithDB
    // TODO: update app with new history timestamps
    // TODO3: repair live changes.ts
    // TODO4: repair parsePage with cheerio
    // TODO: keep old changes for products with no history
    // TODO: parse cats for existing products

    await mergeChangesWithDB();

    startDate = printTime('mergeChangesWithDB', startDate); // 289ms

    if (params.includes('--parse-pages')) {
        await Promise.all(parseCategories.map(async page => await parsePage(page)));
        //await parsePage(parseCategories[0]);
    }

    if (params.includes('--parse-pages-n-parts')) {
        await Promise.all([...parseCategories, ...parsePartPacks].map(async page => await parsePage(page)));
    }

    startDate = printTime('parsePages', startDate); // 24sec

    // write items
    let orderedProducts = parsedDataToday.items.sort((a, b) => {
        if (a.id < b.id) {
            return -1;
        }
        if (a.id > b.id) {
            return 1;
        }
        return 0;
    }).map((product) => {
        return convertToReduce(product);
    });

    // exclude history
    const productHistory = {};
    orderedProducts = orderedProducts.map((product) => {
        productHistory[product.id] = product.hi;
        delete product.hi;
        return product;
    });

    if (params.includes('--create-compare')) {
        // write images files
        if (Object.keys(parsedDataToday.images).length > 0) {
            await handleCache(
                './data/api/',
                `images.compare.json`,
                () => JSON.stringify(parsedDataToday.images, null, 2),
                true);
        }

        // write compare file
        await handleCache(
            './data/',
            `all-products.compare.json`,
            () => JSON.stringify(orderedProducts, null, 2),
            true);

        await handleCache(
            './data/',
            `all-products.history.compare.json`,
            () => JSON.stringify(productHistory, null, 2),
            true);
    } else {
        await handleCache(
            './data/',
            `all-products.json`,
            () => JSON.stringify(orderedProducts, null, 2),
            true);
        await handleCache(
            './data/',
            `all-products.history.json`,
            () => JSON.stringify(productHistory, null, 2),
            true);
    }
    printTime('all done', startDate); // 50ms
})();

