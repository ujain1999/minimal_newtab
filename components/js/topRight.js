function renderTopRight(settings) {
    loadStylesheet('components/css/topRight.css');
    const topRightOrder = settings.topRightOrder;
    let container = document.getElementById("top-right");
    container.innerHTML = "";
    topRightOrder.map((item) => {
        if (item.displayBool) {
            let itemElem = document.createElement("span");
            itemElem.id = "open-" + item["id"];
            itemElem.innerHTML = item["id"];
            itemElem.addEventListener('click', () => {
                chrome.tabs.create({ url: item['url'] });
            })
            container.append(itemElem);
        }

    });
}

export { renderTopRight };